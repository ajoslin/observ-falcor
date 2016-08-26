var assert = require('assert')
var Struct = require('observ-struct-free')
var Observ = require('observ')
var ObservArray = require('observ-array')
var dotProp = require('dot-prop')
var partialRight = require('ap').partialRight
var assign = require('xtend/mutable')
var ListMethods = require('./methods')
var joinPaths = require('../util/join-paths')
var setNonEnumerable = require('../util/set-non-enumerable')

function getPathProp (obj, path) {
  return dotProp.get(obj, path.join('.'))
}

function noop () {}

module.exports = function FalcorList (model, options) {
  options = options || {}
  var store = options.store
  var prefix = options.prefix
  var keyPath = options.keyPath || ['id']
  var keyGetter = partialRight(getPathProp, keyPath)

  assert.ok(store && typeof store.put === 'function', 'options.store required')

  var state = ObservArray([])
  var range = Struct({
    from: Observ(options.from || 0),
    length: Observ(options.length || 0)
  })

  state(function onChange (array) {
    setNonEnumerable(array, 'from', range.from())
  })

  // length is reserved, so we have to use defineProperty to write to it
  Object.defineProperty(state, 'length', {
    get: function () { return range.length }
  })

  // All the other properties can be given through assign
  return assign(
    state,
    ListMethods(model, prefix),
    {
      from: range.from,
      saveRange: saveRange,
      fetchData: fetchData,
      fetchRange: fetchRange,
      fetchRangeAndData: fetchRangeAndData
    }
  )

  function saveRange (values, callback) {
    if (arguments.length === 1) {
      callback = values
      values = range()
    }

    model.setLocal([
      {path: prefix.concat('from'), value: values.from},
      {path: prefix.concat('length'), value: values.length}
    ], callback)
  }

  function fetchRangeAndData (callback) {
    callback = callback || noop

    fetchRange(function (error) {
      if (error) return callback(error)
      fetchData(callback)
    })
  }

  function fetchRange (callback) {
    callback = callback || noop

    model.get(prefix.concat('from'), prefix.concat('length'), onRange)

    function onRange (error, graph) {
      if (error || !graph) {
        return callback(error || new TypeError('fetchRange: No data at ' + JSON.stringify(prefix)))
      }

      var rangeData = getPathProp(graph.json, prefix)
      range.set({
        from: rangeData.from || 0,
        length: rangeData.length || 0
      })
      callback(null, range)
    }
  }

  function fetchData (callback) {
    callback = callback || noop

    model.get(joinPaths(prefix.concat(range()), store.paths()), onData)

    function onData (error, graph) {
      if (error || !graph) {
        return callback(error || new TypeError('fetchData: No data at ' + JSON.stringify(prefix)))
      }

      var list = getPathProp(graph.json, prefix)
      state.transaction(function (array) {
        array.length = range.length()

        var arrayIndex = 0
        for (var index = range.from(), max = range.from() + range.length(); index < max; index++) {
          var data = list[index]
          var id = getId(data)
          var value = store.put(id, data)
          array[arrayIndex++] = value
        }
      })
      callback(null, list)
    }
  }

  function getId (data) {
    var id = keyGetter(data)
    if (id == null) {
      throw new TypeError('Key path ' + JSON.stringify(keyPath) +
                          ' is empty for data at ' + JSON.stringify(prefix))
    }
    return id
  }
}
