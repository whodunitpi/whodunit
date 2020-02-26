'use strict';
var Investigator = require('@whodunit/investigator');

// Example of a simple investigator.
//
// A raw function that is executed when this investigator is resolved.
//
// It takes a list of arguments (usually CLI args) and a Hash of options
// (CLI options), the context of the function is a `new Investigator.Base`
// object, which means that you can use the API as if you were extending
// `Base`.
//
// It works with simple investigator. If you need to do a bit more complex
// stuff, extend from Investigator.Base and defines your investigator steps
// in several methods.

class SimpleInvestigator extends Investigator {
  exec() {}
}

SimpleInvestigator.description =
  'And add a custom description by adding a `description` property to your function.';
SimpleInvestigator.usage = 'Usage can be used to customize the help output';

module.exports = SimpleInvestigator;
