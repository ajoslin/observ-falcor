'use strict'

var assert = require('assert')
var extend = require('xtend')
var updateStruct = require('soft-update-struct')
var dotProp = require('dot-prop')
var partial = require('ap').partial
var VarHash = require('observ-varhash')
var WeakStore = require('weakmap-shim/create-store')
var watch = require('../watch')
var joinPaths = require('../util/join-paths')
var isEqual = require('../util/is-equal')
var setNonEnumerable = require('../util/set-non-enumerable')

var unlisteners = WeakStore()

var defaults = {}

module.exports = function Store (model, options) {
  options = extend(defaults, options)

  assert.equal(typeof options.construct, 'function', 'function options.construct required')
  assert.ok(Array.isArray(options.paths), 'array options.paths required')
  assert.ok(Array.isArray(options.prefix), 'array options.prefix required')

  var prefix = options.prefix
  var paths = options.paths

  var state = VarHash({})
  var _put = state.put
  var _delete = state.delete

  setNonEnumerable(state, {
    paths: getPaths,
    prefix: getPrefix,
    has: has,
    delete: del,
    put: put,
    fetch: fetch
  })

  return state

  function getPaths () {
    return paths
  }

  function getPrefix () {
    return prefix
  }

  function has (id) {
    return state.get(id) != null
  }

  function del (id) {
    if (!state.has(id)) return

    var unlisten = unlisteners(state.get(id)).unlisten
    if (unlisten) unlisten()
    _delete(id)
  }

  function put (id, data) {
    if (state.has(id)) return state.get(id)

    var value = options.construct(data)
    assert.ok(typeof value === 'function' && typeof value.set === 'function',
              'options.construct must return an observ instance')

    var unlisten = watch(model, prefix.concat(id), partial(handleChange, id))

    _put(id, value)
    unlisteners(value).unlisten = unlisten

    return value
  }

  function fetch (id, callback) {
    if (state.has(id)) return callback(null, state.get(id))

    getData(id, {local: false}, onFetchData)

    function onFetchData (error, data) {
      if (error) return callback(error)

      if (state.has(id)) {
        handleChange(id, callback)
      } else {
        callback(null, state.put(id, data))
      }
    }
  }

  function handleChange (id, callback) {
    callback = callback || function () {}

    getData(id, {local: true}, onData)

    function onData (error, data) {
      if (error) callback(error)

      var value = state.get(id)
      if (value._type === 'observ-struct') {
        updateStruct(value, data, isEqual)
      } else {
        value.set(data)
      }
      callback(null, value)
    }
  }

  function getData (id, opts, callback) {
    var method = opts.local ? 'getLocal' : 'get'
    model[method](joinPaths(prefix.concat(id), paths), onGetData)

    function onGetData (error, graph) {
      if (error) {
        return callback(error)
      }
      if (!graph || !graph.json) {
        return callback(new TypeError('No data in graph at ' + JSON.stringify(prefix.concat(id))))
      }

      var data = dotProp.get(graph.json, prefix.concat(id).join('.'))
      callback(null, data)
    }
  }
}
