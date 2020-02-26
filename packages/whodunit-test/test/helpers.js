'use strict';
var util = require('util');
var path = require('path');
var assert = require('assert');
var sinon = require('sinon');
var RunContext = require('../lib/run-context');
var whodunit = require('@whodunit/environment');
var Investigator = require('@whodunit/investigator');
var helpers = require('../lib');
var env = whodunit.createEnv();

describe('@whodunit/test', function() {
  beforeEach(function() {
    process.chdir(path.join(__dirname, './fixtures'));
    var self = this;

    this.StubInvestigator = function(args, options) {
      self.args = args;
      self.options = options;
    };

    util.inherits(this.StubInvestigator, Investigator);
  });

  describe('.registerDependencies()', function() {
    it('accepts dependency as a path', function() {
      helpers.registerDependencies(env, [
        require.resolve('./fixtures/investigator-simple/app')
      ]);
      assert(env.get('simple:app'));
    });

    it('accepts dependency as array of [<investigator>, <name>]', function() {
      helpers.registerDependencies(env, [[this.StubInvestigator, 'stub:app']]);
      assert(env.get('stub:app'));
    });
  });

  describe('.createInvestigator()', function() {
    it('create a new investigator', function() {
      var investigator = helpers.createInvestigator('unicorn:app', [
        [this.StubInvestigator, 'unicorn:app']
      ]);

      assert.ok(investigator instanceof this.StubInvestigator);
    });

    it('pass args params to the investigator', function() {
      helpers.createInvestigator(
        'unicorn:app',
        [[this.StubInvestigator, 'unicorn:app']],
        ['temp']
      );

      assert.deepEqual(this.args, ['temp']);
    });

    it('pass options param to the investigator', function() {
      helpers.createInvestigator(
        'unicorn:app',
        [[this.StubInvestigator, 'unicorn:app']],
        ['temp'],
        { ui: 'tdd' }
      );

      assert.equal(this.options.ui, 'tdd');
    });
  });

  describe('.mockPrompt()', function() {
    beforeEach(function() {
      this.investigator = env.instantiate(helpers.createDummyInvestigator());
      helpers.mockPrompt(this.investigator, { answer: 'foo' });
    });

    it('uses default values', function() {
      return this.investigator
        .prompt([{ name: 'respuesta', type: 'input', default: 'bar' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, 'bar');
        });
    });

    it('uses default values when no answer is passed', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());
      helpers.mockPrompt(investigator);
      return investigator
        .prompt([{ name: 'respuesta', message: 'foo', type: 'input', default: 'bar' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, 'bar');
        });
    });

    it('supports `null` answer for `list` type', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());

      helpers.mockPrompt(investigator, {
        respuesta: null
      });

      return investigator
        .prompt([{ name: 'respuesta', message: 'foo', type: 'list', default: 'bar' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, null);
        });
    });

    it('treats `null` as no answer for `input` type', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());

      helpers.mockPrompt(investigator, {
        respuesta: null
      });

      return investigator
        .prompt([{ name: 'respuesta', message: 'foo', type: 'input', default: 'bar' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, 'bar');
        });
    });

    it('uses `true` as the default value for `confirm` type', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());
      helpers.mockPrompt(investigator, {});

      return investigator
        .prompt([{ name: 'respuesta', message: 'foo', type: 'confirm' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, true);
        });
    });

    it('supports `false` answer for `confirm` type', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());
      helpers.mockPrompt(investigator, { respuesta: false });

      return investigator
        .prompt([{ name: 'respuesta', message: 'foo', type: 'confirm' }])
        .then(function(answers) {
          assert.equal(answers.respuesta, false);
        });
    });

    it('prefers mocked values over defaults', function() {
      return this.investigator
        .prompt([{ name: 'answer', type: 'input', default: 'bar' }])
        .then(function(answers) {
          assert.equal(answers.answer, 'foo');
        });
    });

    it('can be call multiple time on the same investigator', function() {
      var investigator = env.instantiate(helpers.createDummyInvestigator());
      helpers.mockPrompt(investigator, { foo: 1 });
      helpers.mockPrompt(investigator, { foo: 2 });
      return investigator.prompt({ message: 'bar', name: 'foo' }).then(function(answers) {
        assert.equal(answers.foo, 2);
      });
    });

    it('keep prompt method asynchronous', function() {
      var spy = sinon.spy();

      var promise = this.investigator
        .prompt({ name: 'answer', type: 'input' })
        .then(function() {
          sinon.assert.called(spy);
        });

      spy();
      return promise;
    });
  });

  describe('.run()', function() {
    it('return a RunContext object', function() {
      assert(helpers.run(helpers.createDummyInvestigator()) instanceof RunContext);
    });

    it('pass settings to RunContext', function() {
      var runContext = helpers.run(helpers.createDummyInvestigator(), { foo: 1 });
      assert.equal(runContext.settings.foo, 1);
    });
  });
});
