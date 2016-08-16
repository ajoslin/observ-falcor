const test = require('tape')
const LazyModel = require('falcor-lazy-model')
const Model = require('falcor').Model
const Methods = require('./methods')

test('list methods: insert multiple in negative list', function (t) {
  const falcorModel = new Model({
    cache: {
      itemsById: {
        a: {value: 1},
        b: {value: 2},
        c: {value: 3},
        foo: {value: 4},
        bar: {value: 5}
      },
      items: {
        '-1': Model.ref(['itemsById', 'a']),
        0: Model.ref(['itemsById', 'b']),
        1: Model.ref(['itemsById', 'c']),
        from: -1,
        length: 3
      }
    }
  })
  const model = LazyModel((cb) => cb(falcorModel))
  const methods = Methods(model, ['items'])

  methods.falcorInsert({
    index: 0,
    values: [
      Model.ref(['itemsById', 'foo']),
      Model.ref(['itemsById', 'bar'])
    ]
  }, function (error) {
    t.ifError(error)

    model.get(['items', {from: -1, length: 5}], ['items', ['length', 'from']], function (error, graph) {
      t.ifError(error)

      t.deepEqual(graph.json.items, {
        from: -1,
        length: 5,
        '-1': ['itemsById', 'a'],
        0: ['itemsById', 'foo'],
        1: ['itemsById', 'bar'],
        2: ['itemsById', 'b'],
        3: ['itemsById', 'c']
      })
      t.end()
    })
  })
})

test('list methods: remove', function (t) {
  const falcorModel = new Model({
    itemsById: {
      a: {value: 1},
      b: {value: 2},
      c: {value: 3},
      d: {value: 4}
    },
    cache: {
      items: {
        '-1': Model.ref(['itemsById', 'a']),
        0: Model.ref(['itemsById', 'b']),
        1: Model.ref(['itemsById', 'c']),
        2: Model.ref(['itemsById', 'd']),
        from: -1,
        length: 4
      }
    }
  })
  const model = LazyModel((cb) => cb(falcorModel))
  const methods = Methods(model, ['items'])

  methods.falcorRemove({
    index: 0,
    count: 2
  }, function (error) {
    t.ifError(error)

    model.get(['items', {from: -1, length: 2}], ['items', ['length', 'from']], function (error, graph) {
      t.ifError(error)

      t.deepEqual(graph.json.items, {
        from: -1,
        length: 2,
        '-1': ['itemsById', 'a'],
        0: ['itemsById', 'd']
      })
      t.end()
    })
  })
})

test('list methods: reorder', function (t) {
  const falcorModel = new Model({
    itemsById: {
      a: {value: 1},
      b: {value: 2},
      c: {value: 3},
      d: {value: 4}
    },
    cache: {
      items: {
        0: Model.ref(['itemsById', 'a']),
        1: Model.ref(['itemsById', 'b']),
        2: Model.ref(['itemsById', 'c']),
        3: Model.ref(['itemsById', 'd']),
        from: 0,
        length: 4
      }
    }
  })
  const model = LazyModel((cb) => cb(falcorModel))
  const methods = Methods(model, ['items'])

  methods.falcorReorder({
    from: 3,
    to: 1
  }, function (error, result) {
    t.ifError(error)
    model.get(['items', {from: 0, length: 4}], ['items', ['length', 'from']], onGet)

    function onGet (error, graph) {
      t.ifError(error)

      t.deepEqual(graph.json.items, {
        0: ['itemsById', 'a'],
        1: ['itemsById', 'd'],
        2: ['itemsById', 'b'],
        3: ['itemsById', 'c'],
        from: 0,
        length: 4
      })
      t.end()
    }
  })
})

test('list methods: findRefIndex', function (t) {
  const falcorModel = new Model({
    itemsById: {
      a: {value: 1},
      b: {value: 2},
      c: {value: 3},
      d: {value: 4}
    },
    cache: {
      items: {
        0: Model.ref(['itemsById', 'a']),
        1: Model.ref(['itemsById', 'b']),
        2: Model.ref(['itemsById', 'c']),
        3: Model.ref(['itemsById', 'd']),
        from: 0,
        length: 4
      }
    }
  })
  const model = LazyModel((cb) => cb(falcorModel))
  const methods = Methods(model, ['items'])

  t.plan(4)

  methods.falcorFindIndex({
    predicate: (value) => value[1] === 'c'
  }, function (error, index) {
    t.ifError(error)
    t.equal(index, 2)
  })

  methods.falcorFindIndex({
    predicate: () => false
  }, function (error, index) {
    t.ifError(error)
    t.equal(index, undefined)
  })
})
