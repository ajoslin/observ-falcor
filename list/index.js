var assert = require('assert')
var ObservVarlist = require('observ-varlist')
var dotProp = require('dot-prop')

var extend = require('xtend')
var assign = require('xtend/mutable')
var partialRight = require('ap').partialRight
// var ListMethods = require('./methods')
var joinPaths = require('../util/join-paths')

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

  var state = ObservVarlist([])

  return assign(state, {
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

    model.invalidate(prefix.concat('from'), prefix.concat('length'), onInvalidate)

    function onInvalidate () {
      model.get(prefix.concat('from'), prefix.concat('length'), onRange)
    }

    function onRange (error, graph) {
      if (error || !graph) {
        return callback(error || new TypeError('fetchRange: No data at ' + JSON.stringify(prefix)))
      }

      var rangeData = getPathProp(graph.json, prefix)
      state.from.set(rangeData.from || 0)
      state.count.set(rangeData.length || 0)

      callback(null, state())
    }
  }

  function fetchData (callback) {
    callback = callback || noop

    var listPrefix = prefix.concat({
      from: state.from(),
      length: state.count()
    })

    model.invalidate(listPrefix, function () {
      model.get(joinPaths(listPrefix, store.paths()), onData)
    })

    function onData (error, graph) {
      if (error || !graph) {
        return callback(error || new TypeError('fetchData: No data at ' + JSON.stringify(prefix)))
      }

      var graphData = getPathProp(graph.json, prefix)
      var result = {}

      for (var i = state.from(), ii = state.from() + state.count(); i < ii; i++) {
        var data = graphData[i]
        var id = getId(data)
        var value = store.put(id, data)
        result[i] = value
      }

      state.reset(extend(result, {
        from: state.from(),
        length: state.count()
      }))

      callback(null, state())
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
