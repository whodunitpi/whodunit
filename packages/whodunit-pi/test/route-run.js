'use strict';
const assert = require('assert');
const fs = require('fs');
const sinon = require('sinon');
const Configstore = require('configstore');
const Router = require('../lib/router');
const runRoute = require('../lib/routes/run');
const helpers = require('./helpers');

const conf = new Configstore('pipi-test-purposes', {
  investigatorRunCount: {}
});

describe('run route', () => {
  beforeEach(function () {
    this.insight = helpers.fakeInsight();
    this.env = helpers.fakeEnv();
    this.router = new Router(this.env, this.insight, conf);
    this.router.registerRoute('run', runRoute);
  });

  afterEach(() => {
    fs.unlinkSync(conf.path);
  });

  it('run an investigation', function () {
    assert.equal(conf.get('investigatorRunCount').foo, undefined);
    this.router.navigate('run', 'foo:app');

    assert.equal(conf.get('investigatorRunCount').foo, 1);
    sinon.assert.calledWith(this.insight.track, 'pipi', 'run', 'foo');
    sinon.assert.calledWith(this.env.run, 'foo:app');

    this.router.navigate('run', 'foo:app');
    assert.equal(conf.get('investigatorRunCount').foo, 2);
  });
});
