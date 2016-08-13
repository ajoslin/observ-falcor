module.exports = function joinPaths (prefix, paths) {
  if (!paths.length) return [prefix]

  // Expected to be an array of array paths
  if (!Array.isArray(paths[0])) paths = [paths]

  // If a path consists of a set of non-array values, we know it's getting multiple
  // sibling values from a falcor object. In that case, we need to wrap those
  // sibling values in an array so that when they get concatenated with the Falcor
  // object's prefix it will work correctly.
  return paths.map(function (path) {
    var isFlatPath = Array.isArray(path) && !path.some(Array.isArray)
    if (isFlatPath) path = [path]

    return prefix.concat(path)
  })
}
