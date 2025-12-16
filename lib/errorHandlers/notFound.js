'use strict'

import { helper } from "../routes/helper.js"
import { JsonApiError } from "./JsonApiError.js"

/**
 *
 */
export class notFound {
  /**
   * @param {import("../Router.js").Router} router
   */
  static register(router) {
    router.bindNotFound((request, res) => helper.handleError(router, request, res, new JsonApiError({
      status: 404,
      code: 'EINVALID',
      title: 'Invalid Route',
      detail: 'This is not the API you are looking for?'
    })))
  }
}