'use strict'
const helper = require('../routes/helper.js')
const router = require('../router.js')

module.exports = class notFound {
  static register() {
    router.bindNotFound((request, res) => helper.handleError(request, res, {
      status: '404',
      code: 'EINVALID',
      title: 'Invalid Route',
      detail: 'This is not the API you are looking for?'
    }))
  }
}