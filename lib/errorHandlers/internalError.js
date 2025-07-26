'use strict'
const helper = require('../routes/helper.js')
const router = require('../router.js')
const jsonApiErrHandler = require('../jsonApiErrHandler.js')

module.exports = class internalError {
  static register() {
    router.bindErrorHandler((request, res, error) => {
      if (jsonApiErrHandler.handler) {
        jsonApiErrHandler.handler(request, error)
      }

      return helper.handleError(request, res, {
        status: '500',
        code: 'EUNKNOWN',
        title: 'An unknown error has occured. Sorry?',
        detail: '??'
      })
    })
  }
}