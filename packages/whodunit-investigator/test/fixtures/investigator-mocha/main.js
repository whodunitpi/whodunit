'use strict';

// Example of a simple investigator.
//
// A raw function that is executed when this investigator is resolved.
//
// It takes a list of arguments (usually CLI args) and a Hash of options
// (CLI options), the context of the function is a `new Investigator.Base`
// object, which means that you can use the API as if you were extending
// `Base`.
//
// It works with simple investigator, if you need to do a bit more complex
// stuff, extends from Investigator.Base and defines your investigator steps
// in several methods.
var util = require('util');
var Base = require('../../../');

module.exports = function(args, options) {
  Base.apply(this, arguments);
  console.log('Executing investigator with', args, options);
};
util.inherits(module.exports, Base);

module.exports.name = 'You can name your investigator';
module.exports.description =
  'Ana add a custom description by adding a `description` property to your function.';
module.exports.usage = 'Usage can be used to customize the help output';

// Namespace is resolved depending on the location of this investigator,
// unless you specifically define it.
module.exports.namespace = 'mocha:investigator';
