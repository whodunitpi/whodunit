'use strict';
const assert = require('assert');
const proxyquire = require('proxyquire');

describe('pi version', () => {
  const latestVersion = {
    catch() {
      return latestVersion;
    }
  };
  const rule = proxyquire('../lib/rules/pi-version', {
    'latest-version'() {
      return latestVersion;
    }
  });

  it('pass if it\'s new enough', cb => {
    latestVersion.then = callback => {
      callback('1.0.0');
    };

    rule.verify(err => {
      assert(!err, err);
      cb();
    });
  });

  it('fail if it\'s too old', cb => {
    latestVersion.then = callback => {
      callback('999.999.999');
    };

    rule.verify(err => {
      assert(err, err);
      cb();
    });
  });
});
