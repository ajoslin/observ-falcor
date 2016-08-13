var assert = require('assert')
var Event = require('weakmap-event')
var debounce = require('next-tick-debounce')
var WeakStore = require('weakmap-shim/create-store')

var store = WeakStore()
function noop () {}

var FalcorChangeEvent = Event()

module.exports = function watchPath (falcorModel, path, listener) {
  assert(Array.isArray(path), 'array path expected')
  var unlisten
  var disposed = false

  getNativeModel(falcorModel, onModel)

  return function () {
    disposed = true
    if (unlisten) unlisten()
  }

  function onModel (model) {
    if (disposed) return

    var state = getModelState(model)
    var pathVersion = PathVersion(state, path)

    unlisten = FalcorChangeEvent.listen(state, onChange)

    function onChange () {
      var newVersion = model.getVersion(path)
      if (pathVersion === newVersion) return

      pathVersion = newVersion
      PathVersion(state, path, newVersion)

      listener()
    }
  }
}

function getNativeModel (model, callback) {
  if (model.falcorModel) {
    return model.falcorModel(function (_, model) {
      callback(model)
    })
  }
  callback(model)
}

function getModelState (falcorModel) {
  var root = falcorModel._root
  var state = store(root)

  if (state.initialized) return state

  var broadcastChange = debounce(function () {
    FalcorChangeEvent.broadcast(state, {})
  })

  var _onChange = root.onChange || noop
  root.onChange = falcorModelChange

  state.pathVersions = {}
  state.initialized = true

  return state

  function falcorModelChange () {
    _onChange()
    broadcastChange()
  }
}

function PathVersion (state, path, version) {
  var key = path.join('.')

  if (arguments.length === 3) {
    state.pathVersions[key] = version
  } else if (!(key in state.pathVersions)) {
    state.pathVersions[key] = 0
  }

  return state.pathVersions[key]
}
