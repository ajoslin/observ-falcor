var Queue = require('queue-that-callback')

module.exports = function getOpQueueForPrefix (model, prefix) {
  var queues = model.__queues = model.__queues || {}
  var key = prefix.join('.')
  if (!(key in queues)) {
    queues[key] = Queue()
  }

  return queues[key]
}
