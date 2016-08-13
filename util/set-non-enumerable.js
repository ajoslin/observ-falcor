module.exports = function setNonEnumerable (object, keyOrObj, value) {
  if (typeof keyOrObj === 'object') {
    for (var key in keyOrObj) setNonEnumerable(object, key, keyOrObj[key])
    return
  }
  Object.defineProperty(object, keyOrObj, {
    value: value,
    writable: true,
    configurable: true,
    enumerable: false
  })
}
