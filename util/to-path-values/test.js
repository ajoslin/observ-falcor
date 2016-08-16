const test = require('tape')
const toPathValues = require('./')

test('toPathValues: basic', function (t) {
  t.deepEqual(
    toPathValues({
      a: 1,
      b: 2
    }),
    [{
      path: ['a'],
      value: 1
    }, {
      path: ['b'],
      value: 2
    }]
  )
  t.end()
})

test('toPathValues: nested', function (t) {
  t.deepEqual(
    toPathValues({
      items: {
        0: {id: 0, title: '0title'},
        1: {id: 1, title: '1title'},
        length: 2
      }
    }),
    [{
      path: ['items', '0', 'id'],
      value: 0
    }, {
      path: ['items', '0', 'title'],
      value: '0title'
    }, {
      path: ['items', '1', 'id'],
      value: 1
    }, {
      path: ['items', '1', 'title'],
      value: '1title'
    }, {
      path: ['items', 'length'],
      value: 2
    }]
  )
  t.end()
})

test('toPathValues: atom', function (t) {
  t.deepEqual(
    toPathValues({
      a: 1,
      atom: {
        $type: 'atom',
        foo: 'bar',
        baz: 'bang'
      }
    }),
    [{
      path: ['a'],
      value: 1
    }, {
      path: ['atom'],
      value: {
        $type: 'atom',
        foo: 'bar',
        baz: 'bang'
      }
    }]
  )

  t.end()
})
