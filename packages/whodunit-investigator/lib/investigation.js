'use strict';
const EventEmitter = require('events');

/**
 * The `Investigation` class provides the common API shared by all investigations.
 * It defines the yes/no test that will be run. It is used by the investigation
 * to build a decision tree that results in a `Conclusion` 
 * *
 * Every investigation should extend this base class.
 *
 * @constructor
 *
 * @param {Object} props
 * @param {Object} env
 *
 * @property {Object}   env         - the current Environment being run
 * @property {Object}   props        - Provide properties at initialization
 * @property {Function} log         - Output content through Interface Adapter
 *
 * @example
 * const { Investigation } = require('@whodunit/investigator');
 * module.exports = class extends Investigation {
 *   async investigate(yes, no) {
 *     if(this.doSomeCheck())
 *          yes("Huge success!")
 *     else
 *          no("Failed miserably!!")
 *   }
 * };
 */
class Investigation extends EventEmitter {
    constructor(name, props, env) {
        super();

        this.name = name;
        this.props = props || {};
        this.env = env;

        // Mirror the adapter log method on the investigation.
        //
        // example:
        // this.log('foo');
        // this.log.error('bar');
        this.log = this.env.adapter.log;
    }


    /**
     * Runs the investigation, scheduling prototype methods on a run queue. Method names
     * will determine the order each method is run. Methods without special names
     * will run in the default queue.
     *
     * Any method named `constructor` and any methods prefixed by a `_` won't be scheduled.
     *
     * You can also supply the arguments for the method to be invoked. If none are
     * provided, the same values used to initialize the invoker are used to
     * initialize the invoked.
     *
     * @return {Promise} Resolved once the process finish
     */
    run(cb) {
        this._running = true;
        this._cb = cb;
        this.emit('run');

        // call investigate
        this.investigate(this._yes, this._no);

        this.emit('end');
        this._running = false;

        return;
    }

    getMessage() {
        return this._message;
    }

    yes(next) {
        this._yes = this._createCallback("yes", next);
        return this;
    }

    no(next) {
        this._no = this._createCallback("no", next);
        return this;
    }

    _createCallback(answer, next) {
        const self = this;
        return (message) => {
            self._message = message;
            self._cb[answer](message, next);
        };
    }
}

module.exports = Investigation;
