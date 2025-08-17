'use strict'
const helper = require('../routes/helper.js')
const router = require('../router.js')
const jsonApiErrHandler = require('../jsonApiErrHandler.js')
const { JsonApiError } = require('./JsonApiError.js')

module.exports = class internalError {
  static register() {
    router.bindErrorHandler((request, res, errorState) => {
      if(
        errorState instanceof JsonApiError ||
        (Array.isArray(errorState) && errorState.every(e => e instanceof JsonApiError))
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