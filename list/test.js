const test = require('tape')
const Model = require('falcor').Model
const Struct = require('observ-struct')
const Observ = require('observ')
const LazyModel = require('falcor-lazy-model')
const toPathValues = require('../util/to-path-values')
const Store = require('../store')
const List = require('./')

function setup (graph, callback) {
  if (typeof graph === 'function') {
    callback = graph
    graph = {
      items: {
        0: {id: 0, title: '0title'},
        1: {id: 1, title: '1title'},
        length: 2
      }
    }
  }
  const model = LazyModel((cb) => cb(new Model()))

  const store = Store(model, {
    prefix: ['itemsById'],
    paths: ['title', 'id'],
    construct: (data) => Struct({
      title: Observ(data.title),
      id: Observ(data.id)
    })
  })

  const list = List(model, {
    store,
    prefix: ['items']
  })

  model.set.apply(model, toPathValues(graph).concat(function onSet () {
    callback({model, store, list})
  }))
}

test('list: basic', function (t) {
  setup(function ({model, store, list}) {
    t.deepEqual(list(), [])

    list.fetchRange(function (error, range) {
      t.ifError(error)
      t.equal(list.from(), 0)
      t.equal(list.length(), 2)

      list.fetchData(function (error) {
        t.ifError(error)
        t.deepEqual(list(), [
          {title: '0title', id: 0},
          {title: '1title', id: 1}
        ])
        t.end()
      })
    })
  })
})

test('list: append then fetch', function (t) {
  setup(function ({model, store, list}) {
    list.fetchRangeAndData(function () {
      t.equal(list.from(), 0)
      t.equal(list.length(), 2)

      list.falcorAppend({
        value: Model.atom({title: '2title', id: 2})
      }, function (error, range) {
        t.ifError(error)
        list.length.set(3)

        list.fetchData(function (error, range) {
          t.ifError(error)
          t.deepEqual(list(), [
            {title: '0title', id: 0},
            {title: '1title', id: 1},
            {title: '2title', id: 2}
          ])
          t.end()
        })
      })
    })
  })
})
