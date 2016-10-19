var assert = require('assert')
var ObservVarlist = require('observ-varlist')
var dotProp = require('dot-prop')

var extend = require('xtend')
var assign = require('xtend/mutable')
var partialRight = require('ap').partialRight
var joinPaths = require('../util/join-paths')
var errors = require('../errors')

function getPathProp (obj, path) {
  return dotProp.get(obj, path.join('.'))
}

function defaultThrowIfError (error) {
  if (error) throw error
}

module.exports = function FalcorList (model, options) {
  options = options || {}
  var store = options.store
  var prefix = options.prefix
  var keyPath = options.keyPath || ['id']
  var keyGetter = partialRight(getPathProp, keyPath)

  assert.ok(store && typeof store.put === 'function', 'options.store required')

  var state = ObservVarlist([])

  return assign(state, {
    invalidate: invalidate,
    fetchData: fetchData,
    fetchRange: fetchRange,
    fetchRangeAndData: fetchRangeAndData
  })

  function invalidate (callback) {
    model.invalidate(prefix, callback)
  }

  function fetchRangeAndData (callback) {
    callback = callback || defaultThrowIfError

    fetchRange(function (error) {
      if (error) return callback(error)
      fetchData(callback)
    })
  }

  function fetchRange (callback) {
    callback = callback || defaultThrowIfError

    model.get(prefix.concat('from'), prefix.concat('length'), onRange)

    function onRange (error, graph) {
      if (error || !graph) {
        return callback(new errors.RangeNotFoundError(
          'No "length" property found at prefix ' + JSON.stringify(prefix),
          error
        ))
      }

      var rangeData = getPathProp(graph.json, prefix)
      state.from.set(rangeData.from || 0)
      state.count.set(rangeData.length || 0)
      callback(null, state())
    }
  }

  function fetchData (callback) {
    callback = callback || defaultThrowIfError

    var listPrefix = prefix.concat({
      from: state.from(),
      length: state.count()
    })

    model.get(joinPaths(listPrefix, store.paths()), onData)

    function onData (error, graph) {
      if (error || !graph) {
        return callback(new errors.DataNotFoundError(
          'No data found in range ' + JSON.stringify({from: state.from(), length: state.count()}) +
            ' at path ' + JSON.stringify(prefix),
          error
        ))
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
