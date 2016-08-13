var assert = require('assert')
var Struct = require('observ-struct-free')
var Observ = require('observ')
var ObservArray = require('observ-array')
var dotProp = require('dot-prop')
var partialRight = require('ap').partialRight
var assign = require('xtend/mutable')
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

  assert.ok(store && typeof store.put === 'function', 'options.store required')

  var keyGetter = partialRight(getPathProp, options.keyPath || ['id'])
  var range = Struct({
    from: Observ(0),
    length: Observ(0)
  })

  var state = ObservArray([])

  state(function onChange (array) {
    setNonEnumerable(array, 'from', range.from())
  })

  // length is reserved, so we have to use defineProperty to write to it
  Object.defineProperty(state, 'length', {
    get: function () { return range.length }
  })

  // All the other properties can be given through assign
  return assign(state, {
    from: range.from,
    fetchData: fetchData,
    fetchRange: fetchRange,
    fetchRangeAndData: fetchRangeAndData
  })

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
    if (!id) {
      throw new TypeError('Key path ' + JSON.stringify(options.keyPath) +
                          ' is empty for data at ' + JSON.stringify(prefix))
    }
    return id
  }
}
