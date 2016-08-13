# observ-falcor [![Build Status](https://travis-ci.org/ajoslin/observ-falcor.svg?branch=master)](https://travis-ci.org/ajoslin/observ-falcor)

> Easily manage Falcor lists / hashes with the [observ](https://github.com/raynos/observ)-family

Intended for use in your mercury apps that use Falcor.

**Project status**: Mad Scientist / WIP

## Install

```
$ npm install --save observ-falcor
```

## Usage

Minimum:

```js
var ObservFalcor = require('observ-falcor')
var Model = require('falcor').Model
var LazyModel = require('falcor-lazy-model')
var Struct = require('observ-struct')

var model = LazyModel((cb) => cb(new Model()))

var observFalcor = ObservFalcor(model)

// This is an observVarHash with some extra functionality
var userStore = observFalcor.store({
  prefix: ['userById'],
  paths: ['firstName', 'lastName', 'handle', 'id'],
  construct: User
})

// This is an observArray with some extra functionality
var userList = observFalcor.list({
  prefix: ['groupById', 6, 'users']
  store: userStore
})

function User (data) {
  return Struct({/* ... */})
}
```

## API

WIP. See design.md for notes.

## License

MIT © [Andrew Joslin](http://ajoslin.com)
