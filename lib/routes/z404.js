'use strict'
const helper = require('./helper.js')
const router = require('../router.js')

module.exports = class fourOhFour {
  static register() {
    router.bind404((request, res) => helper.handleError(request, res, {
      status: '404',
      code: 'EINVALID',
      title: 'Invalid Route',
      detail: 'This is not the API you are looking for?'
    }))
  }
}