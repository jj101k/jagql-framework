'use strict'

const jsonApi = require('../..')

class ChainHandler extends jsonApi.ChainHandler {
  // 1 is used by the example in resources/autoincrement.js
  #i = 2

  beforeCreate(request, newResource, callback) {
    // Autoincrement the ID.
    // In practice this would actually be handled by the underlying database.
    newResource.id = (this.#i++).toString()
    callback(null, request, newResource)
  }
}

const chainHandler = new ChainHandler()

module.exports = chainHandler.chain(new jsonApi.MemoryHandler())
