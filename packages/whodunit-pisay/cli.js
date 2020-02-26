#!/usr/bin/env node
'use strict';
const pkg = require('./package.json');
const pisay = require('.');

require('taketalk')({
  init(input, options) {
    console.log(pisay(input, options));
  },
  help() {
    console.log(`
  ${pkg.description}

  Usage
    $ pisay <string>
    $ pisay <string> --maxLength 8
    $ echo <string> | pisay

  Example
    $ pisay 'Sindre is a horse'
    ${pisay('Sindre is a horse')}`);
  },
  version: pkg.version
});
