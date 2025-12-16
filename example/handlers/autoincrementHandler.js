'use strict'

import { jsonApi } from "../../lib/jsonApi.js"

class ChainHandler extends jsonApi.CallbackHandlers.Chain {
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

export default chainHandler.chain(new jsonApi.CallbackHandlers.Memory())
