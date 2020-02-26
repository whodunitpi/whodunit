#! /usr/bin/env node
'use strict';
const env = require('@whodunit/environment').createEnv();
const tabtab = require('tabtab')({
  name: 'pi',
  cache: !process.env.PI_TEST
});
const Completer = require('./completer');

const completer = new Completer(env);

tabtab.completer = completer;

// Lookup installed investigator in whodunit environment,
// respond completion results with each investigator
tabtab.on('pi', completer.complete.bind(completer));

// Register complete command
tabtab.start();

module.exports = tabtab;
