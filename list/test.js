const test = require('tape')
const Model = require('falcor').Model
const Struct = require('observ-struct')
const Observ = require('observ')
const LazyModel = require('falcor-lazy-model')
const Store = require('../store')
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
    t.deepEqual(list(), [])

    list.fetchRange(function (error, range) {
      t.ifError(error)
      t.equal(list.from(), 0)
      t.equal(list.length(), 2)

      list.fetchData(function (error) {
        t.ifError(error)
        t.deepEqual(list(), [
          {title: 'atitle', id: 'a'},
          {title: 'btitle', id: 'b'}
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
        value: Model.atom({title: 'ctitle', id: 'c'})
      }, function (error, range) {
        t.ifError(error)
        list.from.set(range.from)
        list.length.set(range.length)

        list.fetchData(function (error, range) {
          t.ifError(error)
          t.deepEqual(list(), [
            {title: 'atitle', id: 'a'},
            {title: 'btitle', id: 'b'},
            {title: 'ctitle', id: 'c'}
          ])
          t.end()
        })
      })
    })
  })
})

test('list: prepend then fetch', function (t) {
  setup(function ({model, store, list}) {
    list.fetchRangeAndData(function () {
      t.equal(list.from(), 0)
      t.equal(list.length(), 2)

      list.falcorPrepend({
        value: Model.atom({title: 'ctitle', id: 'c'})
      }, function (error, range) {
        t.ifError(error)
        list.from.set(range.from)
        list.length.set(range.length)

        list.fetchData(function (error) {
          t.ifError(error)
          t.deepEqual(list(), [
            {title: 'ctitle', id: 'c'},
            {title: 'atitle', id: 'a'},
            {title: 'btitle', id: 'b'}
          ])
          t.end()
        })
      })
    })
  })
})
