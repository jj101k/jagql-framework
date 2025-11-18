'use strict'

const helper = require('../routes/helper.js')
const { JsonApiError } = require('./JsonApiError.js')

/**
 *
 */
module.exports = class notFound {
  /**
   * @param {import("../Router.js")} router
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