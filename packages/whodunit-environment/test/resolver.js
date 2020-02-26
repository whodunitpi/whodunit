'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const spawn = require('cross-spawn');
const Environment = require('../lib/environment');

const globalLookupTest = process.env.NODE_PATH ? it : xit;

describe('Environment Resolver', function () {
  this.timeout(100000);

  describe('#lookup()', () => {
    const scopedFolder = path.resolve('node_modules/@dummyscope');
    const scopedInvestigator = path.join(scopedFolder, 'investigator-scoped');

    before(function () {
      this.projectRoot = path.join(__dirname, 'fixtures/lookup-project');
      process.chdir(this.projectRoot);
      spawn.sync('npm', ['install', '--no-package-lock']);
      spawn.sync('npm', ['install', 'investigator-jquery', '--no-package-lock']);
      spawn.sync('npm', ['install', '-g', 'investigator-dummytest', 'investigator-dummy', '--no-package-lock']);

      fs.symlinkSync(
				path.resolve('../investigator-extend'),
				path.resolve('node_modules/investigator-extend'),
				'dir'
      );

      if (!fs.existsSync(scopedFolder)) {
        fs.mkdirSync(scopedFolder);
      }

      if (!fs.existsSync(scopedInvestigator)) {
        fs.symlinkSync(
					path.resolve('../investigator-scoped'),
					scopedInvestigator,
					'dir'
        );
      }
    });

    after(function () {
      fs.unlinkSync(path.join(this.projectRoot, 'node_modules/investigator-extend'));
      fs.unlinkSync(scopedInvestigator);
      fs.rmdirSync(scopedFolder);
      process.chdir(__dirname);
    });

    beforeEach(function (done) {
      this.env = new Environment();
      assert.equal(this.env.namespaces().length, 0, 'ensure env is empty');
      this.env.lookup(done);
    });

    it('register local investigators', function () {
      assert.ok(this.env.get('dummy:app'));
      assert.ok(this.env.get('dummy:pi'));
    });

    it('register investigators in scoped packages', function () {
      assert.ok(this.env.get('@dummyscope/scoped:app'));
    });

    it('register non-dependency local investigator', function () {
      assert.ok(this.env.get('jquery:app'));
    });

    if (!process.env.NODE_PATH) {
      console.log('Skipping tests for global investigators. Please setup `NODE_PATH` environment variable to run it.');
    }

    it('local investigators prioritized over global', function () {
      const resolved = this.env.get('dummy:app').resolved;
      assert.ok(resolved.indexOf('lookup-project') !== -1, `Couldn't find 'lookup-project' in ${resolved}`);
    });

    globalLookupTest('register global investigators', function () {
      assert.ok(this.env.get('dummytest:app'));
      assert.ok(this.env.get('dummytest:controller'));
    });

    it('register symlinked investigators', function () {
      assert.ok(this.env.get('extend:support'));
    });

    describe('when there\'s ancestor node_modules/ folder', () => {
      before(function () {
        this.projectSubRoot = path.join(this.projectRoot, 'subdir');
        process.chdir(this.projectSubRoot);
        spawn.sync('npm', ['install', '--no-package-lock']);
      });

      beforeEach(function () {
        this.env = new Environment();
        assert.equal(this.env.namespaces().length, 0, 'ensure env is empty');
        this.env.lookup();
      });

      it('register investigators in ancestor node_modules directory', function () {
        assert.ok(this.env.get('jquery:app'));
      });

      it('local investigators are prioritized over ancestor', function () {
        const resolved = this.env.get('dummy:app').resolved;
        assert.ok(resolved.indexOf('subdir') !== -1, `Couldn't find 'subdir' in ${resolved}`);
      });
    });
  });

  describe('#getNpmPaths()', () => {
    beforeEach(function () {
      this.NODE_PATH = process.env.NODE_PATH;
      this.bestBet = path.join(__dirname, '../../../..');
      this.bestBet2 = path.join(path.dirname(process.argv[1]), '../..');
      this.env = new Environment();
    });

    afterEach(function () {
      process.env.NODE_PATH = this.NODE_PATH;
    });

    describe('with NODE_PATH', () => {
      beforeEach(() => {
        process.env.NODE_PATH = '/some/dummy/path';
      });

      afterEach(() => {
        delete process.env.NODE_PATH;
      });

      it('walk up the CWD lookups dir', function () {
        const paths = this.env.getNpmPaths();
        assert.equal(paths[0], path.join(process.cwd(), 'node_modules'));
        assert.equal(paths[1], path.join(process.cwd(), '../node_modules'));
      });

      it('append NODE_PATH', function () {
        assert(this.env.getNpmPaths().indexOf(process.env.NODE_PATH) >= 0);
      });
    });

    describe('without NODE_PATH', () => {
      beforeEach(() => {
        delete process.env.NODE_PATH;
      });

      it('walk up the CWD lookups dir', function () {
        const paths = this.env.getNpmPaths();
        assert.equal(paths[0], path.join(process.cwd(), 'node_modules'));
        const prevdir = process.cwd().split(path.sep).slice(0, -1).join(path.sep);
        assert.equal(paths[1], path.join(prevdir, 'node_modules'));
      });

      it('append best bet if NODE_PATH is unset', function () {
        assert(this.env.getNpmPaths().indexOf(this.bestBet) >= 0);
        assert(this.env.getNpmPaths().indexOf(this.bestBet2) >= 0);
      });

      it('append default NPM dir depending on your OS', function () {
        if (process.platform === 'win32') {
          assert(this.env.getNpmPaths().indexOf(path.join(process.env.APPDATA, 'npm/node_modules')) >= 0);
        } else {
          assert(this.env.getNpmPaths().indexOf('/usr/lib/node_modules') >= 0);
        }
      });
    });

    describe('with NVM_PATH', () => {
      beforeEach(() => {
        process.env.NVM_PATH = '/some/dummy/path';
      });

      afterEach(() => {
        delete process.env.NVM_PATH;
      });

      it('walk up the CWD lookups dir', function () {
        const paths = this.env.getNpmPaths();
        assert.equal(paths[0], path.join(process.cwd(), 'node_modules'));
        assert.equal(paths[1], path.join(process.cwd(), '../node_modules'));
      });

      it('append NVM_PATH', function () {
        assert(this.env.getNpmPaths().indexOf(path.join(path.dirname(process.env.NVM_PATH), 'node_modules')) >= 0);
      });
    });

    describe('without NVM_PATH', () => {
      beforeEach(() => {
        delete process.env.NVM_PATH;
      });

      it('walk up the CWD lookups dir', function () {
        const paths = this.env.getNpmPaths();
        assert.equal(paths[0], path.join(process.cwd(), 'node_modules'));
        assert.equal(paths[1], path.join(process.cwd(), '../node_modules'));
      });

      it('append best bet if NVM_PATH is unset', function () {
        assert(this.env.getNpmPaths().indexOf(path.join(this.bestBet, 'node_modules')) >= 0);
        assert(this.env.getNpmPaths().indexOf(this.bestBet2) >= 0);
      });
    });
  });
});
