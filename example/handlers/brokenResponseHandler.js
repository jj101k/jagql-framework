'use strict'

import { jsonApi } from "../../lib/jsonApi.js"

class BrokenResponseHandler extends jsonApi.PromiseHandlers.Chain {
  afterFind(request, result) {
    result.boolean = Number(result.boolean)
    result.number = String(result.number)
    return result
  }
}

const brokenResponseHandler = new BrokenResponseHandler()

export default brokenResponseHandler.chain(new jsonApi.PromiseHandlers.Memory())
