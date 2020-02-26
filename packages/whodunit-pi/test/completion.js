'use strict';
const path = require('path');
const assert = require('assert');
const events = require('events');
const {execFile} = require('child_process');
const {find} = require('lodash');
const Completer = require('../lib/completion/completer');
const completion = require('../lib/completion');

const help = `
  Usage:
  pi backbone:app [options] [<app_name>]

  Options:
    -h,   --help                # Print the investigator's options and usage
          --skip-cache          # Do not remember prompt answers                         Default: false
          --skip-install        # Do not automatically install dependencies              Default: false
          --appPath             # Name of application directory                          Default: app
          --requirejs           # Support requirejs                                      Default: false
          --template-framework  # Choose template framework. lodash/handlebars/mustache  Default: lodash
          --test-framework      # Choose test framework. mocha/jasmine                   Default: mocha

  Arguments:
    app_name    Type: String  Required: false`;

describe('Completion', () => {
  before(function () {
    this.env = require('@whodunit/environment').createEnv();
  });

  describe('Test completion STDOUT output', () => {
    it('Returns the completion candidates for both options and installed investigators', done => {
      const picomplete = path.join(__dirname, '../lib/completion/index.js');
      const pi = path.join(__dirname, '../lib/cli');

      let cmd = 'export cmd="pi" && PI_TEST=true DEBUG="tabtab*" COMP_POINT="4" COMP_LINE="$cmd" COMP_CWORD="$cmd"';
      cmd += `node ${picomplete} completion -- ${pi} $cmd`;

      execFile('bash', ['-c', cmd], (err, out) => {
        if (err) {
          done(err);
          return;
        }

        assert.ok(/-f/.test(out));
        assert.ok(/--force/.test(out));
        assert.ok(/--version/.test(out));
        assert.ok(/--no-color/.test(out));
        assert.ok(/--no-insight/.test(out));
        assert.ok(/--insight/.test(out));
        assert.ok(/--investigators/.test(out));

        done();
      });
    });
  });

  describe('Completion', () => {
    it('Creates tabtab instance', () => {
      assert.ok(completion instanceof events);
    });
  });

  describe('Completer', () => {
    beforeEach(function () {
      // Mock / Monkey patch env.getInvestigatorsMeta() here, since we pass the
      // instance directly to completer.
      this.getInvestigatorsMeta = this.env.getInvestigatorsMeta;

      this.env.getInvestigatorsMeta = () => ({
        'dummy:app': {
          resolved: '/home/user/.nvm/versions/node/v6.1.0/lib/node_modules/investigator-dummy/app/index.js',
          namespace: 'dummy:app'
        },
        'dummy:pi': {
          resolved: '/home/user/.nvm/versions/node/v6.1.0/lib/node_modules/investigator-dummy/pi/index.js',
          namespace: 'dummy:pi'
        }
      });

      this.completer = new Completer(this.env);
    });

    afterEach(function () {
      this.env.getInvestigatorsMeta = this.getInvestigatorsMeta;
    });

    describe('#parseHelp', () => {
      it('Returns completion items based on help output', function () {
        const results = this.completer.parseHelp('backbone:app', help);
        const first = results[0];

        assert.equal(results.length, 6);
        assert.deepEqual(first, {
          name: '--skip-cache',
          description: 'Do not remember prompt answers                         Default-> false'
        });
      });
    });

    describe('#item', () => {
      it('Format results into { name, description }', function () {
        const list = ['foo', 'bar'];
        const results = list.map(this.completer.item('pi!', '--'));
        assert.deepEqual(results, [{
          name: '--foo',
          description: 'pi!'
        }, {
          name: '--bar',
          description: 'pi!'
        }]);
      });

      it('Escapes certain characters before consumption by shell scripts', function () {
        const list = ['foo'];

        const desc = '#  pi I\'m a very subtle description, with chars that likely will break your Shell: yeah I\'m mean';
        const expected = 'pi I m a very subtle description, with chars that likely will break your Shell-> yeah I m mean';
        const results = list.map(this.completer.item(desc, '-'));

        assert.equal(results[0].description, expected);
      });
    });

    describe('#investigator', () => {
      it('Returns completion candidates from investigator help output', function (done) {
        // Here we test against pi --help (could use dummy:pi --help)
        this.completer.complete({last: ''}, (err, results) => {
          if (err) {
            done(err);
            return;
          }

          /* eslint no-multi-spaces: 0 */
          assert.deepEqual(results, [
            {name: '--force',    description: 'Overwrite files that already exist'},
            {name: '--version',  description: 'Print version'},
            {name: '--no-color', description: 'Disable colors'},
            {name: '-f',         description: 'Overwrite files that already exist'}
          ]);

          done();
        });
      });
    });

    describe('#complete', () => {
      it('Returns the list of user installed investigators as completion candidates', function (done) {
        this.completer.complete({last: 'pi'}, (err, results) => {
          if (err) {
            done(err);
            return;
          }

          const dummy = find(results, result => result.name === 'dummy:pi');
          assert.equal(dummy.name, 'dummy:pi');
          assert.equal(dummy.description, 'pi');

          done();
        });
      });
    });
  });
});
