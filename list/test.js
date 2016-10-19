const test = require('tape')
const Model = require('falcor').Model
const Struct = require('observ-struct')
const Observ = require('observ')
const LazyModel = require('falcor-lazy-model')
const Store = require('../store')
const errors = require('../errors')
const List = require('./')

function setup (graph, callback) {
  if (typeof graph === 'function') {
    callback = graph
    graph = {
      itemsById: {
        a: {title: 'atitle', id: 'a'},
        b: {title: 'btitle', id: 'b'}
      },
      items: {
        0: Model.ref(['itemsById', 'a']),
        1: Model.ref(['itemsById', 'b']),
        length: 2
      }
    }
  }
  const model = LazyModel((cb) => cb(new Model({
    cache: graph
  })))

  // Just call the callback for invalidate during these tests
  model.invalidate = function noopInvalidate () {
    arguments[arguments.length - 1]()
  }

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

  callback({model, store, list})
}

test('list: basic', function (t) {
  setup(function ({model, store, list}) {
    t.deepEqual(list(), {from: 0, count: 0})

    list.fetchRange(function (error, range) {
      t.ifError(error)
      t.equal(list.from(), 0)
      t.equal(list.count(), 2)

      list.fetchData(function (error) {
        t.ifError(error)
        t.deepEqual(list(), {
          from: 0,
          count: 2,
          0: {title: 'atitle', id: 'a'},
          1: {title: 'btitle', id: 'b'}
        })
        t.end()
      })
    })
  })
})

test('errors', function (t) {
  t.plan(2)
  setup({}, function ({model, store, list}) {
    list.fetchRange((error) => {
      t.ok(error instanceof errors.RangeNotFoundError)
    })

    list.fetchData((error) => {
      t.ok(error instanceof errors.DataNotFoundError)
    })
  })
})
