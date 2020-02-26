'use strict';
const path = require('path');
const _ = require('lodash');
const titleize = require('titleize');
const humanizeString = require('humanize-string');
const readPkgUp = require('read-pkg-up');
const updateNotifier = require('update-notifier');
const Configstore = require('configstore');
const {namespaceToName} = require('@whodunit/environment');

/**
 * The router is in charge of handling `pi` different screens.
 * @constructor
 * @param  {Environment} env A Whodunit environment instance
 * @param  {Insight} insight An insight instance
 * @param  {Configstore} [conf] An optional config store instance
 */
class Router {
  constructor(env, insight, conf) {
    const pkg = require('../package.json');
    this.routes = {};
    this.env = env;
    this.insight = insight;
    this.conf = conf || new Configstore(pkg.name, {
      investigatorRunCount: {}
    });
  }

  /**
   * Navigate to a route
   * @param  {String} name Route name
   * @param  {*}      arg  A single argument to pass to the route handler
   */
  navigate(name, arg) {
    if (typeof this.routes[name] === 'function') {
      return this.routes[name].call(null, this, arg);
    }

    throw new Error(`No routes called: ${name}`);
  }

  /**
   * Register a route handler
   * @param {String}   name    Name of the route
   * @param {Function} handler Route handler
   */
  registerRoute(name, handler) {
    this.routes[name] = handler;
    return this;
  }

  /**
   * Update the available investigators in the app
   * TODO: Move this function elsewhere, try to make it stateless.
   */
  updateAvailableInvestigators() {
    this.investigators = {};

    const resolveInvestigators = investigator => {
      // Skip sub investigators
      if (!/:(app|all)$/.test(investigator.namespace)) {
        return;
      }

      const {pkg} = readPkgUp.sync({cwd: path.dirname(investigator.resolved)});

      if (!pkg) {
        return;
      }

      pkg.namespace = investigator.namespace;
      pkg.appInvestigator = true;
      pkg.prettyName = titleize(humanizeString(namespaceToName(investigator.namespace)));
      pkg.update = updateNotifier({pkg}).update;

      if (pkg.update && pkg.version !== pkg.update.latest) {
        pkg.updateAvailable = true;
      }

      this.investigators[pkg.name] = pkg;
    };

    _.forEach(this.env.getInvestigatorsMeta(), resolveInvestigators);
  }
}

module.exports = Router;
