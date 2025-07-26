'use strict'

const notFound = require('./notFound')
const internalError = require('./internalError')

module.exports = class errorHandlers {
  static handlers = { }

  static register() {
    this.handlers.notFound = notFound
    this.handlers.internalError = internalError
    for (const handler of Object.values(this.handlers)) {
      handler.register()
    }
  }
}