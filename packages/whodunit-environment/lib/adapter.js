'use strict';
const _ = require('lodash');
const inquirer = require('inquirer');
const chalk = require('chalk');
const logger = require('./util/log');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const wrapAnsi = require('wrap-ansi');
const termSize = require('term-size');

/**
 * `TerminalAdapter` is the default implementation of `Adapter`, an abstraction
 * layer that defines the I/O interactions.
 *
 * It provides a CLI interaction
 *
 * @constructor
 */
class TerminalAdapter {
  constructor() {
    this.promptModule = inquirer.createPromptModule();
  }

  get _colorYes() {
    return chalk.black.bgGreen;
  }

  get _colorNo() {
    return chalk.bgRed;
  }

  _colorLines(name, str) {
    return str.split('\n').map(line => this[`_colorDiff${name}`](line)).join('\n');
  }

  /**
   * Prompt a user for one or more questions and pass
   * the answer(s) to the provided callback.
   *
   * It shares its interface with `Base.prompt`
   *
   * (Defined inside the constructor to keep interfaces separated between
   * instances)
   *
   * @param {Array} questions
   * @param {Function} callback
   */
  prompt(questions, cb) {
    const promise = this.promptModule(questions);
    promise.then(cb || _.noop);
    return promise;
  }

  start(investigation) {
    return new Promise((resolve, reject) => {
      this.log("");
      this.log(chalk.cyan(`⌛ Starting... ${investigation.name}`));
      const cb = {
        yes: (message, next) => {
          this.log(chalk.green(`✔ ${investigation.name}${message ? ": " + message : ""}`));
          this._process(next, resolve);
        },
        no: (message, next) => {
          this.log(chalk.red(`✘ ${investigation.name}${message ? ": " + message : ""}`));
          this._process(next, resolve);
        }
      };
      try {
        investigation.run(cb);
      } catch (err) {
        reject(err);
      }
    });
  }

  _process(next, resolve) {
    if (next._status) {
      this._conclude(next);
      resolve(next);
    }
    else {
      this.start(next).then(conclusion => conclusion);
    }
  }

  _conclude(conclusion) {
    marked.setOptions({
      // Define custom renderer
      renderer: new TerminalRenderer({
        heading: conclusion._status === "fail" ? chalk.red.bold : chalk.green.bold,
      }),
    });

    this.log("");
    this.log("Done!");
    this.log("");
    this.log(marked(wrapAnsi(conclusion.getMarkdown(this.props), termSize().columns - 6)));
  }
}

/**
 * Logging utility
 * @type {env/log}
 */
TerminalAdapter.prototype.log = logger();

module.exports = TerminalAdapter;
