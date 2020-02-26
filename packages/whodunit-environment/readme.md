# whodunit Environment

> Handles the lifecycle and bootstrapping of investigators in a specific environment

It provides a high-level API to discover, create and run investigators, as well as further tuning of where and how an investigator is resolved.


## Install

```
$ npm install @whodunit/environment
```


## Usage

Full documentation will be available [here](http://whodunit.io/authoring/integrating-whodunit.html).

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
