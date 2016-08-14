'use strict'

var assert = require('assert')
var List = require('./list')
var Store = require('./store')

module.exports = function ObservFalcor (model) {
  assert.ok(model._falcorLazyModel, 'model must be an instance of "falcor-lazy-model"')

  var stores = {}

  return {
    store: createStore,
    list: createList
  }

  function createStore (options) {
    assert.ok(Array.isArray(options.prefix), 'array options.prefix required')

    var key = options.prefix.join('.')
    if (key in stores) {
      return stores[key]
    }

    var store = Store(model, options)
    stores[key] = store
    return store
  }

  function createList (options) {
    return List(model, options)
  }
}
