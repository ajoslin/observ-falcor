const assert = require('assert')

module.exports = function assertRange (range) {
  assert.equal(typeof range, 'object', 'object range expected')
  assert.equal(typeof range.from, 'number', 'number range.from expected')
  assert.equal(typeof range.length, 'number', 'number range.length expected')
}
