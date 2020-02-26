'use strict';
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const chalk = require('chalk');
const _ = require('lodash');
const GroupedQueue = require('grouped-queue');
const escapeStrRe = require('escape-string-regexp');
const untildify = require('untildify');
const memFs = require('mem-fs');
const debug = require('debug')('whodunit:environment');
const isScoped = require('is-scoped');
const Store = require('./store');
const resolver = require('./resolver');
const TerminalAdapter = require('./adapter');

/**
 * Two-step argument splitting function that first splits arguments in quotes,
 * and then splits up the remaining arguments if they are not part of a quote.
 */
function splitArgsFromString(argsString) {
  let result = [];
  const quoteSeparatedArgs = argsString.split(/(\x22[^\x22]*\x22)/).filter(x => x);
  quoteSeparatedArgs.forEach(arg => {
    if (arg.match('\x22')) {
      result.push(arg.replace(/\x22/g, ''));
    } else {
      result = result.concat(arg.trim().split(' '));
    }
  });
  return result;
}

/**
 * Wrap callback so it can't get called twice
 */
const callbackWrapper = (investigator, done) => {
  if (!done) {
    return _.noop();
  }
  let callbackHandled = false;
  const callback = err => {
    if (!callbackHandled) {
      callbackHandled = true;
      done(err);
    }
  };
  // If error was thrown, make sure it is handled and only once
  investigator.on('error', callback);
  return callback;
};

/**
 * `Environment` object is responsible of handling the lifecyle and bootstrap
 * of investigators in a specific environment (your app).
 *
 * It provides a high-level API to create and run investigators, as well as further
 * tuning where and how an investigator is resolved.
 *
 * An environment is created using a list of `arguments` and a Hash of
 * `options`. Usually, this is the list of arguments you get back from your CLI
 * options parser.
 *
 * An optional adapter can be passed to provide interaction in non-CLI environment
 * (e.g. IDE plugins), otherwise a `TerminalAdapter` is instantiated by default
 *
 * @constructor
 * @mixes env/resolver
 * @param {String|Array} args
 * @param {Object} opts
 * @param {TerminalAdapter} [adaper] - A TerminalAdapter instance or another object
 *                                     implementing this adapter interface. This is how
 *                                     you'd interface Whodunit with a GUI or an editor.
 */
class Environment extends EventEmitter {
  static get queues() {
    return [
      'initializing',
      'prompting',
      'configuring',
      'default',
      'investigate',
      'end'
    ];
  }

  /**
   * Make sure the Environment present expected methods if an old version is
   * passed to a Investigator.
   * @param  {Environment} env
   * @return {Environment} The updated env
   */
  static enforceUpdate(env) {
    if (!env.adapter) {
      env.adapter = new TerminalAdapter();
    }

    if (!env.runLoop) {
      env.runLoop = new GroupedQueue([
        'initializing',
        'prompting',
        'configuring',
        'default',
        'investigate',
        'end'
      ]);
    }

    if (!env.sharedFs) {
      env.sharedFs = memFs.create();
    }

    return env;
  }

  /**
   * Factory method to create an environment instance. Take same parameters as the
   * Environment constructor.
   *
   * @see This method take the same arguments as {@link Environment} constructor
   *
   * @return {Environment} a new Environment instance
   */
  static createEnv(args, opts, adapter) {
    return new Environment(args, opts, adapter);
  }

  /**
   * Convert an investigators namespace to its name
   *
   * @param  {String} namespace
   * @return {String}
   */
  static namespaceToName(namespace) {
    return namespace.split(':')[0];
  }

  constructor(args, opts, adapter) {
    super();

    args = args || [];
    this.arguments = Array.isArray(args) ? args : splitArgsFromString(args);
    this.options = opts || {};
    this.adapter = adapter || new TerminalAdapter();
    this.cwd = this.options.cwd || process.cwd();
    this.store = new Store();

    this.runLoop = new GroupedQueue(Environment.queues);
    this.sharedFs = memFs.create();

    // Each composed investigator might set listeners on these shared resources. Let's make sure
    // Node won't complain about event listeners leaks.
    this.runLoop.setMaxListeners(0);
    this.sharedFs.setMaxListeners(0);

    this.lookups = ['.', 'investigators', 'lib/investigators'];
    this.aliases = [];

    this.alias(/^([^:]+)$/, '$1:app');
  }

  /**
   * Error handler taking `err` instance of Error.
   *
   * The `error` event is emitted with the error object, if no `error` listener
   * is registered, then we throw the error.
   *
   * @param  {Object} err
   * @return {Error}  err
   */
  error(err) {
    err = err instanceof Error ? err : new Error(err);

    if (!this.emit('error', err)) {
      throw err;
    }

    return err;
  }

  /**
   * Outputs the general help and usage. Optionally, if investigators have been
   * registered, the list of available investigators is also displayed.
   *
   * @param {String} name
   */
  help(name) {
    name = name || 'init';

    const out = [
      'Usage: :binary: GENERATOR [args] [options]',
      '',
      'General options:',
      '  --help       # Print investigator\'s options and usage',
      '  -f, --force  # Overwrite files that already exist',
      '',
      'Please choose an investigator below.',
      ''
    ];

    const ns = this.namespaces();

    const groups = {};
    for (const namespace of ns) {
      const base = namespace.split(':')[0];

      if (!groups[base]) {
        groups[base] = [];
      }

      groups[base].push(namespace);
    }

    for (const key of Object.keys(groups).sort()) {
      const group = groups[key];

      if (group.length >= 1) {
        out.push('', key.charAt(0).toUpperCase() + key.slice(1));
      }

      for (const ns of groups[key]) {
        out.push(`  ${ns}`);
      }
    }

    return out.join('\n').replace(/:binary:/g, name);
  }

  /**
   * Registers a specific `investigator` to this environment. This investigator is stored under
   * provided namespace, or a default namespace format if none if available.
   *
   * @param  {String} name      - Filepath to the an investigator or a npm package name
   * @param  {String} namespace - Namespace under which register the investigator (optional)
   * @return {String} namespace - Namespace assigned to the registered investigator
   */
  register(name, namespace) {
    if (typeof name !== 'string') {
      return this.error(new Error('You must provide an investigator name to register.'));
    }

    const modulePath = this.resolveModulePath(name);
    namespace = namespace || this.namespace(modulePath);

    if (!namespace) {
      return this.error(new Error('Unable to determine namespace.'));
    }

    this.store.add(namespace, modulePath);

    debug('Registered %s (%s)', namespace, modulePath);
    return this;
  }

  /**
   * Register a stubbed investigator to this environment. This method allow to register raw
   * functions under the provided namespace. `registerStub` will enforce the function passed
   * to extend the Base investigator automatically.
   *
   * @param  {Function} Investigator  - A Investigator constructor or a simple function
   * @param  {String}   namespace  - Namespace under which register the investigator
   * @param  {String}   [resolved] - The file path to the investigator
   * @return {this}
   */
  registerStub(Investigator, namespace, resolved) {
    if (typeof Investigator !== 'function') {
      return this.error(new Error('You must provide a stub function to register.'));
    }

    if (typeof namespace !== 'string') {
      return this.error(new Error('You must provide a namespace to register.'));
    }

    this.store.add(namespace, Investigator, resolved);

    return this;
  }

  /**
   * Returns the list of registered namespace.
   * @return {Array}
   */
  namespaces() {
    return this.store.namespaces();
  }

  /**
   * Returns stored investigators meta
   * @return {Object}
   */
  getInvestigatorsMeta() {
    return this.store.getInvestigatorsMeta();
  }

  /**
   * Get registered investigators names
   *
   * @return {Array}
   */
  getInvestigatorNames() {
    return _.uniq(Object.keys(this.getInvestigatorsMeta()).map(Environment.namespaceToName));
  }

  /**
   * Get a single investigator from the registered list of investigators. The lookup is
   * based on investigator's namespace, "walking up" the namespaces until a matching
   * is found. Eg. if an `angular:common` namespace is registered, and we try to
   * get `angular:common:all` then we get `angular:common` as a fallback (unless
   * an `angular:common:all` investigator is registered).
   *
   * @param  {String} namespaceOrPath
   * @return {Investigator|null} - the investigator registered under the namespace
   */
  get(namespaceOrPath) {
    // Stop the recursive search if nothing is left
    if (!namespaceOrPath) {
      return;
    }

    let namespace = namespaceOrPath;

    // Legacy @whodunit/environment `#hookFor()` function is passing the investigator path as part
    // of the namespace. If we find a path delimiter in the namespace, then ignore the
    // last part of the namespace.
    const parts = namespaceOrPath.split(':');
    const maybePath = _.last(parts);
    if (parts.length > 1 && /[/\\]/.test(maybePath)) {
      parts.pop();

      // We also want to remove the drive letter on windows
      if (maybePath.indexOf('\\') >= 0 && _.last(parts).length === 1) {
        parts.pop();
      }

      namespace = parts.join(':');
    }

    return this.store.get(namespace) ||
      this.store.get(this.alias(namespace)) ||
      // Namespace is empty if namespaceOrPath contains a win32 absolute path of the form 'C:\path\to\investigator'.
      // for this reason we pass namespaceOrPath to the getByPath function.
      this.getByPath(namespaceOrPath);
  }

  /**
   * Get an investigator by path instead of namespace.
   * @param  {String} path
   * @return {Investigator|null} - the investigator found at the location
   */
  getByPath(path) {
    if (fs.existsSync(path)) {
      const namespace = this.namespace(path);
      this.register(path, namespace);

      return this.get(namespace);
    }
  }

  /**
   * Create is the Investigator factory. It takes a namespace to lookup and optional
   * hash of options, that lets you define `arguments` and `options` to
   * instantiate the investigator with.
   *
   * An error is raised on invalid namespace.
   *
   * @param {String} namespace
   * @param {Object} options
   */
  create(namespace, options) {
    options = options || {};

    const Investigator = this.get(namespace);

    if (typeof Investigator !== 'undefined' && typeof Investigator.default === 'function') {
      Investigator.default.resolved = Investigator.resolved;
      Investigator.default.namespace = Investigator.namespace;
      return this.instantiate(Investigator.default, options);
    }

    if (typeof Investigator !== 'function') {
      let investigatorHint = '';
      if (isScoped(namespace)) {
        const splitName = namespace.split('/');
        investigatorHint = `${splitName[0]}/investigator-${splitName[1]}`;
      } else {
        investigatorHint = `investigator-${namespace}`;
      }

      return this.error(
        new Error(
          chalk.red('You don\'t seem to have an investigator with the name “' + namespace + '” installed.') + '\n' +
          'But help is on the way:\n\n' +
          'You can see available investigators via ' +
          chalk.yellow('npm search @whodunit/environment') + ' or via ' + chalk.yellow('http://whodunit.io/investigators/') + '. \n' +
          'Install them with ' + chalk.yellow(`npm install ${investigatorHint}`) + '.\n\n' +
          'To see all your installed investigators run ' + chalk.yellow('pi') + ' without any arguments. ' +
          'Adding the ' + chalk.yellow('--help') + ' option will also show subinvestigators. \n\n' +
          'If ' + chalk.yellow('pi') + ' cannot find the investigator, run ' + chalk.yellow('pi doctor') + ' to troubleshoot your system.'
        )
      );
    }

    return this.instantiate(Investigator, options);
  }

  /**
   * Instantiate a Investigator with metadatas
   *
   * @param {String}       namespace
   * @param {Object}       options
   * @param {Array|String} options.arguments  Arguments to pass the instance
   * @param {Object}       options.options    Options to pass the instance
   */
  instantiate(Investigator, options) {
    options = options || {};

    let args = options.arguments || options.args || _.clone(this.arguments);
    args = Array.isArray(args) ? args : splitArgsFromString(args);

    const opts = options.options || _.clone(this.options);

    opts.env = this;
    opts.resolved = Investigator.resolved || 'unknown';
    opts.namespace = Investigator.namespace;
    return new Investigator(args, opts);
  }

  /**
   * Tries to locate and run a specific investigator. The lookup is done depending
   * on the provided arguments, options and the list of registered investigators.
   *
   * When the environment was unable to resolve an investigator, an error is raised.
   *
   * @param {String|Array} args
   * @param {Object}       options
   * @param {Function}     done
   */
  run(args, options, done) {
    args = args || this.arguments;

    if (typeof options === 'function') {
      done = options;
      options = this.options;
    }

    if (typeof args === 'function') {
      done = args;
      options = this.options;
      args = this.arguments;
    }

    args = Array.isArray(args) ? args : splitArgsFromString(args);
    options = options || this.options;

    const name = args.shift();
    if (!name) {
      console.log(`Must provide at least one argument, the investigator namespace to invoke. ${args}`);
      return this.error(new Error('Must provide at least one argument, the investigator namespace to invoke.'));
    }

    const investigator = this.create(name, {
      args,
      options
    });

    if (investigator instanceof Error) {
      console.log(`Error ${investigator}`);

      return investigator;
    }

    if (options.help) {
      return console.log(investigator.help());
    }

    const _callbackWrapper = callbackWrapper(investigator, done);

    const ret = investigator.run(_callbackWrapper);
    console.log(typeof ret);
    return investigator;
  }

  /**
   * Given a String `filepath`, tries to figure out the relative namespace.
   *
   * ### Examples:
   *
   *     this.namespace('backbone/all/index.js');
   *     // => backbone:all
   *
   *     this.namespace('investigator-backbone/model');
   *     // => backbone:model
   *
   *     this.namespace('backbone.js');
   *     // => backbone
   *
   *     this.namespace('investigator-mocha/backbone/model/index.js');
   *     // => mocha:backbone:model
   *
   * @param {String} filepath
   */
  namespace(filepath) {
    if (!filepath) {
      throw new Error('Missing namespace');
    }

    // Cleanup extension and normalize path for differents OS
    let ns = path.normalize(filepath.replace(new RegExp(escapeStrRe(path.extname(filepath)) + '$'), ''));

    // Sort lookups by length so biggest are removed first
    const lookups = _(this.lookups.concat(['..'])).map(path.normalize).sortBy('length').value().reverse();

    // If `ns` contains a lookup dir in its path, remove it.
    ns = lookups.reduce((ns, lookup) => {
      // Only match full directory (begin with leading slash or start of input, end with trailing slash)
      lookup = new RegExp(`(?:\\\\|/|^)${escapeStrRe(lookup)}(?=\\\\|/)`, 'g');
      return ns.replace(lookup, '');
    }, ns);

    const folders = ns.split(path.sep);
    const scope = _.findLast(folders, folder => folder.indexOf('@') === 0);

    // Cleanup `ns` from unwanted parts and then normalize slashes to `:`
    ns = ns
      .replace(/(.*investigator-)/, '') // Remove before `investigator-`
      .replace(/[/\\](index|main)$/, '') // Remove `/index` or `/main`
      .replace(/^[/\\]+/, '') // Remove leading `/`
      .replace(/[/\\]+/g, ':'); // Replace slashes by `:`

    if (scope) {
      ns = `${scope}/${ns}`;
    }

    debug('Resolve namespaces for %s: %s', filepath, ns);

    return ns;
  }

  /**
   * Resolve a module path
   * @param  {String} moduleId - Filepath or module name
   * @return {String}          - The resolved path leading to the module
   */
  resolveModulePath(moduleId) {
    if (moduleId[0] === '.') {
      moduleId = path.resolve(moduleId);
    }

    if (path.extname(moduleId) === '') {
      moduleId += path.sep;
    }

    return require.resolve(untildify(moduleId));
  }
}

Object.assign(Environment.prototype, resolver);

/**
 * Expose the utilities on the module
 * @see {@link env/util}
 */
Environment.util = require('./util/util');

module.exports = Environment;
