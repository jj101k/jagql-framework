'use strict'
const debug = require('./debugging.js')

module.exports = class handlerEnforcer {
  static wrap(handlers) {
    handlers.search = this.#search(handlers)
    handlers.find = this.#find(handlers)
    handlers.create = this.#create(handlers)
    handlers.update = this.#update(handlers)
    handlers.delete = this.#delete(handlers)
  }

  static #wrapHandler(handlers, operation, outCount) {
    if (typeof outCount !== 'number') {
      throw new Error('Invalid use of this.#wrapHandler!')
    }

    const original = handlers[operation]
    if (!original) return null
    return function () {
      const argsIn = Array.prototype.slice.call(arguments)
      const requestParams = argsIn[0].params
      const callback = argsIn.pop()
      argsIn.push(function () {
        let argsOut = Array.prototype.slice.call(arguments)
        argsOut = argsOut.slice(0, outCount)
        // $FlowFixMe: We've already ruled out any other possible types for outCount?
        while (argsOut.length < outCount) {
          argsOut.push(null)
        }
        debug.handler[operation](JSON.stringify(requestParams), JSON.stringify(argsOut))
        return callback.apply(null, argsOut)
      })
      original.apply(handlers, argsIn)
    }
  }

  static #search(handlers) {
    return this.#wrapHandler(handlers, 'search', 3)
  }

  static #find(handlers) {
    return this.#wrapHandler(handlers, 'find', 2)
  }

  static #create(handlers) {
    return this.#wrapHandler(handlers, 'create', 2)
  }

  static #update(handlers) {
    return this.#wrapHandler(handlers, 'update', 2)
  }

  static #delete(handlers) {
    return this.#wrapHandler(handlers, 'delete', 1)
  }
}


