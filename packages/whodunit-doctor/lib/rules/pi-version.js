'use strict';
const latestVersion = require('latest-version');
const binVersionCheck = require('bin-version-check');
const message = require('../message');

exports.description = 'pi version';

const errors = {
  oldPiVersion() {
    return message.get('pi-version-out-of-date', {});
  }
};
exports.errors = errors;

exports.verify = cb => {
  latestVersion('@whodunit/pi').catch(err => {
    console.error(err);
    cb(err);
  }).then(version => {
    binVersionCheck('pi', `>=${version}`)
      .then(cb, () => cb(errors.oldPiVersion()));
  });
};
