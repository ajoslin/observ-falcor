var makeErrorCause = require('make-error-cause')

exports.RangeNotFoundError = makeErrorCause('RangeNotFoundError')
exports.DataNotFoundError = makeErrorCause('DataNotFoundError')
exports.DataRequestError = makeErrorCause('DataRequestError')
