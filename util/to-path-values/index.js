module.exports = function objectToPathValues (object) {
  var pathValues = []
  var prefix = []

  reduce(pathValues, prefix, object)

  return pathValues
}

function reduce (pathValues, prefix, value) {
  if (value == null) return

  if (typeof value !== 'object' || value.$type === 'atom') {
    pathValues.push({
      path: prefix,
      value: value
    })
    return
  }

  if (Array.isArray(value)) {
    for (var i = (value.from || 0); i < value.length; i++) {
      reduce(pathValues, prefix.concat(i), value[i])
    }
  } else if (typeof value === 'object') {
    for (var key in value) {
      reduce(pathValues, prefix.concat(key), value[key])
    }
  }
}
