/* global suite, bench */
'use strict';
const whodunit = require('..');

suite('Environment', () => {
  bench('#lookup()', done => {
    whodunit.createEnv().lookup(done);
  });
});
