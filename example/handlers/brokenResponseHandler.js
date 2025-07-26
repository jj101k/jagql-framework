'use strict'

const jsonApi = require('../..')

class BrokenResponseHandler extends jsonApi.ChainHandler {
  afterFind(request, result, callback) {
    result.boolean = Number(result.boolean)
    result.number = String(result.number)
    return callback(null, result)
  }
}

const brokenResponseHandler = new BrokenResponseHandler()

module.exports = brokenResponseHandler.chain(new jsonApi.MemoryHandler())
