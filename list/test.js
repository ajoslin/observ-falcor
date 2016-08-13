const test = require('tape')

const Model = require('falcor').Model
const Struct = require('observ-struct')
const Observ = require('observ')
const LazyModel = require('falcor-lazy-model')
const Store = require('../store')
const List = require('./')

function setup (callback) {
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

  model.set({
    path: ['items', 0],
    value: {title: '0title', id: '0'}
  }, {
    path: ['items', 1],
    value: {title: '1title', id: '1'}
  }, {
    path: ['items', 'length'],
    value: 2
  }, function onSet () {
    callback({model, store, list})
  })
}

test('basic', function (t) {
  setup(function ({model, store, list}) {
    t.deepEqual(list(), [])

    list.fetchRange(function (error, range) {
      t.ifError(error)
      t.equal(list.from(), 0)
      t.equal(list.length(), 2)

      list.fetchData(function (error) {
        t.ifError(error)
        t.deepEqual(list(), [
          {title: '0title', id: '0'},
          {title: '1title', id: '1'}
        ])
        t.end()
      })
    })
  })
})
