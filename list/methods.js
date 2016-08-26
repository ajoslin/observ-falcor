var assert = require('assert')
// var partial = require('ap').partial
var dotProp = require('dot-prop')
var extend = require('xtend')
var castArray = require('cast-array')
var falcor = require('falcor')
var assertRange = require('../util/assert-range')
var getOpQueueForPrefix = require('./get-queue')

var Ref = falcor.Model.ref
var PathValue = falcor.Model.pathValue

function PathValueRef (path, value) {
  if (!value || value.$type !== 'ref') {
    value = Ref(value)
  }
  return PathValue(path, value)
}

var methods = {
  falcorAppend: append,
  falcorPrepend: prepend,
  falcorInsert: insert,
  falcorRemove: remove,
  falcorReorder: reorder,
  falcorFindIndex: findIndex
}

module.exports = function ArrayMethods (model, prefix) {
  var queue = getOpQueueForPrefix(model, prefix)

  return Object.keys(methods).reduce(function reduceMethods (acc, name) {
    acc[name] = wrapMethod(methods[name])
    return acc
  }, {})

  function wrapMethod (method) {
    return function falcorListWrapped (options, callback) {
      queue.add(function falcorListQueuedMethod (done) {
        setTimeout(function () {
          method(model, prefix, options, done)
        }, 0)
      }, callback)
    }
  }
}

function append (model, prefix, options, callback) {
  insert(
    model,
    prefix,
    extend(options, {index: 'last'}),
    callback
  )
}

function prepend (model, prefix, options, callback) {
  insert(
    model,
    prefix,
    extend(options, {index: 'first'}),
    callback
  )
}

function insert (model, prefix, options, callback) {
  options = extend({index: 'first'}, options)

  assert.ok(typeof options.index === 'number' || /last|first/.test(options.index),
            'options.index must be number or string "last" or string "first"')
  assert.ok(options.value != null || options.values != null,
            'options.value (single) or options.values (array) required')

  var insertValues = castArray(options.values || options.value)
  var insertCount = insertValues.length

  return getList(model, prefix, options.range, onList)

  function onList (error, list) {
    if (error) return callback(error)

    var newLength = list.length + insertCount
    var insertAt = options.index === 'first' ? list.from
      : options.index === 'last' ? (list.from + list.length)
      : options.index

    model.setLocal(pathValues(), onSet)

    function onSet (error) {
      if (error) return callback(error)
      callback(null, {from: list.from, length: newLength})
    }

    function pathValues () {
      var data = []

      // Add the inserted items
      insertValues.forEach(function (insertValue, insertIndex) {
        data.push(PathValue(prefix.concat(insertAt + insertIndex), insertValue))
      })

      // Shift everything after insertions right by number of insertions
      for (var i = insertAt; i < list.from + list.length; i++) {
        data.push(PathValueRef(prefix.concat(i + insertCount), list[i]))
      }

      // Increment the length
      data.push(PathValue(prefix.concat('length'), newLength))

      return data
    }
  }
}

function remove (model, prefix, options, callback) {
  options = extend({count: 1}, options)

  var count = options.count
  var index = options.index

  assert.equal(typeof index, 'number', 'number options.index required')
  assert.ok(count >= 0, 'non-negative number options.count required')

  getList(model, prefix, onList)

  function onList (error, list) {
    if (error) return callback(error)

    model.setLocal(pathValues(), function (error) {
      callback(error, {from: list.from, length: list.length - count})
    })

    function pathValues () {
      var data = []

      // Shift everything after remove index left by number of items being removed
      for (var i = index + count; i < list.from + list.length; i++) {
        data.push(PathValueRef(prefix.concat(i - count), list[i]))
      }

      // Decrement lenght by count removed
      data.push(PathValue(prefix.concat('length'), list.length - count))

      return data
    }
  }
}

function reorder (model, prefix, options, callback) {
  var from = options.from
  var to = options.to

  assert.equal(typeof from, 'number', 'number options.from required')
  assert.equal(typeof to, 'number', 'number options.to required')

  if (from === to) return callback()

  getList(model, prefix, onList)

  function onList (error, list) {
    if (error) {
      return callback(error)
    }
    if (!(from in list)) {
      return callback(new TypeError('Reorder `from` index is out of bounds: ' + options.from))
    }
    if (!(to in list)) {
      return callback(new TypeError('Reorder `to` index is out of bounds: ' + options.to))
    }

    return model.setLocal(pathValues(), function (error) {
      callback(error, {from: list.from, length: list.length})
    })

    function pathValues () {
      var reorderValue = list[from]
      var data = []

      var i
      if (from < to) {
        for (i = from; i < to; i++) {
          data.push(PathValueRef(prefix.concat(i), list[i + 1]))
        }
      } else {
        for (i = from; i > to; i--) {
          data.push(PathValueRef(prefix.concat(i), list[i - 1]))
        }
      }

      data.push(PathValue(prefix.concat(to), reorderValue))

      return data
    }
  }
}

function findIndex (model, prefix, options, callback) {
  options = options || {}

  // Allow range to optionallly be passed in, if we don't want to search the *whole* list
  var range = options.range
  var predicate = options.predicate

  assert.equal(typeof predicate, 'function', 'function options.predicate expected')

  getList(model, prefix, range, onList)

  function onList (error, list) {
    if (error) return callback(error)

    for (var i = list.from; i < list.from + list.length; i++) {
      if (!predicate(list[i], i, list)) continue

      return callback(null, i)
    }

    // We don't return -1 for a not-found because our lists have negative indices
    return callback()
  }
}

// ----
// Helpers
// ----

function getRange (model, prefix, callback) {
  model.getLocal(prefix.concat([['from', 'length']]), onGet)

  function onGet (error, graph) {
    if (error) return callback(error)

    var range = !graph ? {} : dotProp.get(graph.json, prefix.join('.'))
    range.from = range.from || 0
    range.length = range.length || 0

    callback(null, range)
  }
}

function getList (model, prefix, range, callback) {
  if (arguments.length === 3) {
    callback = range
    range = undefined
  }

  if (range) {
    if (typeof range === 'function') range = range()
    assertRange(range)
    onRange(null, range)
  } else {
    getRange(model, prefix, onRange)
  }

  function onRange (error, range) {
    if (error) return callback(error)

    model.getLocal(prefix.concat(range), onItems)

    function onItems (error, graph) {
      if (error) return callback(error)

      var items = !graph ? {} : dotProp.get(graph.json, prefix.join('.'))
      callback(null, extend(items, range))
    }
  }
}
