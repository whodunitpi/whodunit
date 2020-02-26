'use strict';
const EventEmitter = require('events');
const Environment = require('@whodunit/environment');
const assert = require('@whodunit/assert');
const Base = require('..');

describe('Investigators module', () => {
  describe('Base', () => {
    beforeEach(function() {
      this.env = Environment.createEnv();
      this.investigator = new Base({
        env: this.env,
        resolved: 'test'
      });
    });

    it('is an EventEmitter', function(done) {
      assert.ok(this.investigator instanceof EventEmitter);
      assert.strictEqual(typeof this.investigator.on, 'function');
      assert.strictEqual(typeof this.investigator.emit, 'function');
      this.investigator.on('yay-o-man', done);
      this.investigator.emit('yay-o-man');
    });
  });
});
