/** @module env/log */
'use strict';
const util = require('util');
const EventEmitter = require('events');
const _ = require('lodash');

module.exports = params => {
  // `this.log` is a [logref](https://github.com/mikeal/logref)
  // compatible logger, with an enhanced API.
  //
  // It also has EventEmitter like capabilities, so you can call on / emit
  // on it, namely used to increase or decrease the padding.
  //
  // All logs are done against STDERR, letting you stdout for meaningfull
  // value and redirection, should you need to generate output this way.
  //
  // Log functions take two arguments, a message and a context. For any
  // other kind of paramters, `console.error` is used, so all of the
  // console format string goodies you're used to work fine.
  //
  // - msg      - The message to show up
  // - context  - The optional context to escape the message against
  //
  // @param {Object} params
  // @param {Object} params.colors status mappings
  //
  // Returns the logger
  function log() {
    return log;
  }

  _.extend(log, EventEmitter.prototype);

  // A simple write method, with formatted message.
  //
  // Returns the logger
  log.write = function () {
    return this;
  };

  // Same as `log.write()` but automatically appends a `\n` at the end
  // of the message.
  log.writeln = function () {
    return this;
  };

  // Convenience helper to write sucess status, this simply prepends the
  // message with a gren `✔`.
  log.ok = function () {
    return this;
  };

  log.error = function () {
    return this;
  };

  // A basic wrapper around `cli-table` package, resetting any single
  // char to empty strings, this is used for aligning options and
  // arguments without too much Math on our side.
  //
  // - opts - A list of rows or an Hash of options to pass through cli
  //          table.
  //
  // Returns the table reprensetation
  log.table = opts => {
    const tableData = [];

    opts = Array.isArray(opts) ? {rows: opts} : opts;
    opts.rows = opts.rows || [];

    for (const row of opts.rows) {
      tableData.push(row);
    }

    return table(tableData);
  };

  return log;
};
