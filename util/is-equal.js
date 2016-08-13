module.exports = function falcorIsEqual (value1, value2) {
  if (value1 == null) {
    if (value2 == null) return true
    return false
  }

  if (value1.$type === 'atom' && value2.$type === 'atom') {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return value1.length === value2.length
    }
    return true
  }

  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime()
  }

  return value1 === value2
}
