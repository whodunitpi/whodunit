# whodunit Environment

[![npm](https://badge.fury.io/js/whodunit-environment.svg)](http://badge.fury.io/js/whodunit-environment) [![Build Status](https://travis-ci.org/whodunit/investigator.svg?branch=master)](https://travis-ci.org/whodunit/environment) [![Coverage Status](https://coveralls.io/repos/github/whodunit/environment/badge.svg?branch=master)](https://coveralls.io/github/whodunit/environment?branch=master) [![Gitter](https://img.shields.io/badge/Gitter-Join_the_WHODUNIT_chat_%E2%86%92-00d06f.svg)](https://gitter.im/whodunit/whodunit)

> Handles the lifecycle and bootstrapping of investigators in a specific environment

It provides a high-level API to discover, create and run investigators, as well as further tuning of where and how an investigator is resolved.


## Install

```
$ npm install @whodunit/environment
```


## Usage

Full documentation available [here](http://whodunit.io/authoring/integrating-whodunit.html).

```js
const whodunit = require('@whodunit/environment');
const env = whodunit.createEnv();

// The #lookup() method will search the user computer for installed investigators
// The search if done from the current working directory
env.lookup(() => {
  env.run('angular', {'skip-install': true}, err => {
    console.log('done');
  });
});
```

For advance usage, see [our API documentation](http://whodunit.github.io/environment).


## License

BSD-2-Clause © whodunit
