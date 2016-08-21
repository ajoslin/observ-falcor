const test = require('tape')
const LazyModel = require('falcor-lazy-model')
const Model = require('falcor').Model
const Struct = require('observ-struct')
const Observ = require('observ')
const Store = require('./')

function setup () {
  const model = LazyModel((cb) => cb(new Model()))
  const store = Store(model, {
    prefix: ['bananasById'],
    paths: ['color'],
    construct: (data) => {
      return Struct({
        color: Observ(data.color)
      })
    }
  })

  return {model, store}
}

test('store: put and track changes', function (t) {
  const {model, store} = setup()

  model.set({
    path: ['bananasById', '1', 'color'],
    value: 'yellow'
  }, function (error) {
    t.ifError(error)

    t.equal(store.has('1'), false)
    t.equal(store.get('1'), undefined)

    store.fetch('1', function (error, value) {
      t.ifError(error)
      t.deepEqual(value(), {color: 'yellow'})

      model.set({
        path: ['bananasById', '1', 'color'],
        value: 'blue'
      }, function (error) {
        t.ifError(error)

        t.equal(store.has('1'), true)
        t.equal(store.get('1'), value)

        value.color((color) => {
          t.equal(color, 'blue', 'should track changes')
          t.end()
        })
      })
    })
  })
})

test('store: fetch and remove', function (t) {
  const {model, store} = setup()

  model.set({
    path: ['bananasById', 2, 'color'],
    value: 'red'
  }, function (error) {
    t.ifError(error)

    store.fetch(2, function (error, value) {
      t.ifError(error)
      t.ok(store.has(2))
      t.deepEqual(store.get(2)(), {
        color: 'red'
      })

      store.delete(2)
      t.notOk(store.has(2))

      t.end()
    })
  })
})

test('store: putting an atom', function (t) {
  const {model, store} = setup()

  model.set({
    path: ['bananasById', 'atom'],
    value: Model.atom({
      color: {atomic: true}
    })
  }, function (error) {
    t.ifError(error)

    store.fetch('atom', function (error, value) {
      t.ifError(error)

      t.ok(store.has('atom'))
      t.deepEqual(store.get('atom')(), {
        color: {atomic: true}
      })
      t.end()
    })
  })
})
