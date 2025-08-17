'use strict'

const jsonApi = require('../..')

class BrokenResponseHandler extends jsonApi.PromiseHandlers.Chain {
  afterFind(request, result) {
    result.boolean = Number(result.boolean)
    result.number = String(result.number)
    return result
  }
}

const brokenResponseHandler = new BrokenResponseHandler()

module.exports = brokenResponseHandler.chain(new jsonApi.PromiseHandlers.Memory())
