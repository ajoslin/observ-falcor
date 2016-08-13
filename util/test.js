const test = require('tape')
const assign = require('xtend/mutable')
const isEqual = require('./is-equal')

test('is-equal', function (t) {
  t.ok(isEqual(null, undefined), 'null/undef eq')
  t.ok(isEqual(null, null), 'null/null eq')
  t.ok(isEqual(undefined, undefined), 'undef/undef eq')

  t.ok(isEqual(
    {$type: 'atom'},
    {$type: 'atom'}
  ), 'atoms eq')
  t.ok(isEqual(
    assign(['a'], {$type: 'atom'}),
    assign(['b'], {$type: 'atom'})
  ), 'array atoms eq with same length')
  t.notOk(isEqual(
    assign(['a'], {$type: 'atom'}),
    assign(['a', 'b'], {$type: 'atom'})
  ), 'array atoms not eq with different length')

  var now = new Date()
  var later = new Date(Date.now() + 1000)
  t.ok(isEqual(now, now), 'same date eq')
  t.notOk(isEqual(now, later), 'different date not eq')

  t.end()
})
