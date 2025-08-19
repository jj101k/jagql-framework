'use strict'
const helper = require('../routes/helper.js')
const router = require('../router.js')
const jsonApiErrHandler = require('../jsonApiErrHandler.js')
const { JsonApiError } = require('./JsonApiError.js')

/**
 *
 */
module.exports = class internalError {
  /**
   *
   * @param {*} error
   * @returns
   */
  static #isJsonApiLikeError(error) {
    return error instanceof JsonApiError || (error["code"] && error["status"])
  }

  /**
   *
   */
  static register() {
    router.bindErrorHandler((request, res, errorState) => {
      if(
        this.#isJsonApiLikeError(errorState) ||
        (Array.isArray(errorState) && errorState.every(e => this.#isJsonApiLikeError(e)))
      ) {
        return helper.handleError(request, res, errorState)
      }
      if (jsonApiErrHandler.handler) {
        jsonApiErrHandler.handler(request, errorState)
      }

      return helper.handleError(request, res, new JsonApiError({
        status: 500,
        code: 'EUNKNOWN',
        title: 'An unknown error has occured. Sorry?',
        detail: '??'
      }))
    })
  }
}