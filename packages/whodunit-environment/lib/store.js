'use strict';

/**
 * The Investigator store
 * This is used to store investigator (npm packages) reference and instantiate them when
 * requested.
 * @constructor
 * @private
 */
class Store {
  constructor() {
    this._investigators = {};
    this._meta = {};
  }

  /**
   * Store a module under the namespace key
   * @param {String}          namespace  - The key under which the investigator can be retrieved
   * @param {String|Function} investigator  - A investigator module or a module path
   * @param {String}          [resolved] - The file path to the investigator (used only if investigator is a module)
   */
  add(namespace, investigator, resolved) {
    if (typeof investigator === 'string') {
      this._storeAsPath(namespace, investigator);
      return;
    }

    this._storeAsModule(namespace, investigator, resolved);
  }

  _storeAsPath(namespace, path) {
    this._meta[namespace] = {
      resolved: path,
      namespace
    };

    Object.defineProperty(this._investigators, namespace, {
      get() {
        console.log(path);
        const Investigator = require(path);
        return Investigator;
      },
      enumerable: true,
      configurable: true
    });
  }

  _storeAsModule(namespace, Investigator, resolved = 'unknown') {
    this._meta[namespace] = {
      resolved,
      namespace
    };

    this._investigators[namespace] = Investigator;
  }

  /**
   * Get the module registered under the given namespace
   * @param  {String} namespace
   * @return {Module}
   */
  get(namespace) {
    const Investigator = this._investigators[namespace];

    if (!Investigator) {
      return;
    }

    return Object.assign(Investigator, this._meta[namespace]);
  }

  /**
   * Returns the list of registered namespace.
   * @return {Array} Namespaces array
   */
  namespaces() {
    return Object.keys(this._investigators);
  }

  /**
   * Get the stored investigators meta data
   * @return {Object} Investigators metadata
   */
  getInvestigatorsMeta() {
    return this._meta;
  }
}

module.exports = Store;
