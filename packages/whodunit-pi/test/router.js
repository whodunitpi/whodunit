'use strict';
const path = require('path');
const assert = require('assert');
const _ = require('lodash');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const helpers = require('./helpers');

const Router = proxyquire('../lib/router', {
  'read-pkg-up': {
    sync(options) {
      // Turn `/phoenix/app` into `phoenix-app`
      const name = options.cwd.split(path.sep).filter(chunk => Boolean(chunk)).join('-');
      return {
        pkg: {
          name,
          version: '0.1.0'
        }
      };
    }
  }
});

describe('Router', () => {
  beforeEach(function () {
    this.env = helpers.fakeEnv();
    this.env.getInvestigatorsMeta = sinon.stub();
    this.router = new Router(this.env);
  });

  describe('#registerRoute()', () => {
    it('is chainable', function () {
      assert.equal(this.router.registerRoute('foo', _.noop), this.router);
    });
  });

  describe('#navigate()', () => {
    beforeEach(function () {
      this.route = sinon.spy();
      this.router.registerRoute('foo', this.route);
    });

    it('call a route passing router as first argument', function () {
      this.router.navigate('foo');
      sinon.assert.calledWith(this.route, this.router);
      sinon.assert.calledOnce(this.route);
    });

    it('call a route passing arguments', function () {
      this.router.navigate('foo', 'dummy');
      sinon.assert.calledWith(this.route, this.router, 'dummy');
      sinon.assert.calledOnce(this.route);
    });

    it('throws on invalid route name', function () {
      assert.throws(this.router.navigate.bind(this.route, 'invalid route name'));
    });
  });

  describe('#updateAvailableInvestigators()', () => {
    beforeEach(function () {
      this.env.getInvestigatorsMeta.returns([
        {
          namespace: 'xanadu:all',
          resolved: '/xanadu/all/index.js'
        },
        {
          namespace: 'phoenix:app',
          resolved: '/phoenix/app/index.js'
        },
        {
          namespace: 'phoenix:misc',
          resolved: '/phoenix/misc/index.js'
        },
        {
          namespace: 'phoenix:sub-app',
          resolved: '/phoenix/sub-app/index.js'
        }
      ]);
    });

    it('finds investigators where an `all` investigator is implemented', function () {
      this.router.updateAvailableInvestigators();
      assert.ok(this.router.investigators['xanadu-all'], 'xanadu:all found');
    });

    it('finds investigators where an `app` investigator is implemented', function () {
      this.router.updateAvailableInvestigators();
      assert.ok(this.router.investigators['phoenix-app'], 'phoenix:app found');
    });

    it('ignores sub-investigators', function () {
      this.router.updateAvailableInvestigators();
      assert.ok(!this.router.investigators['phoenix-misc'], 'phoenix:misc ignored');
      assert.ok(!this.router.investigators['phoenix-sub-app'], 'phoenix:sub-app ignored');
    });
  });
});
