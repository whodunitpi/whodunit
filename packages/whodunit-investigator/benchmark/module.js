/* global suite, bench */
'use strict';

suite('@whodunit/environment module', () => {
  bench('require', () => {
    require('..'); // eslint-disable-line import/no-unassigned-import
    delete require.cache[require.resolve('..')];
  });
});
