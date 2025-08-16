'use strict'
const debug = require('./debugging.js')

/**
 * @typedef {import("../types/CallbackHandler.js").CallbackHandler} CallbackHandler
 */

/**
 * This adds logging to all handler endpoints
 */
module.exports = class handlerEnforcer {
  /**
   *
   * @param {CallbackHandler}
   */
  static wrap(handlers) {
    handlers.search = this.#wrapHandler(handlers, 'search', 3)
    handlers.find = this.#wrapHandler(handlers, 'find', 2)
    handlers.create = this.#wrapHandler(handlers, 'create', 2)
    handlers.update = this.#wrapHandler(handlers, 'update', 2)
    handlers.delete = this.#wrapHandler(handlers, 'delete', 1)
  }

  /**
   *
   * @param {CallbackHandler} handlers
   * @param {string} operation
   * @param {number} outCount
   * @returns
   */
  static #wrapHandler(handlers, operation, outCount) {
    if (typeof outCount !== 'number') {
      throw new Error('Invalid use of this.#wrapHandler!')
    }

    const original = handlers[operation]?.bind(handlers)
    if (!original) return null
    const defaultCallbackArgs = [...new Array(outCount)].map(() => null)
    return (request, ...handlerArgs) => {
      const requestParams = request.params
      const callback = handlerArgs.pop()
      return original(request, ...handlerArgs, (...callbackArgs) => {
        const argSlice = [...callbackArgs.slice(0, outCount)]
        // $FlowFixMe: We've already ruled out any other possible types for
        // outCount?
        if(outCount > argSlice.length) {
          argSlice.push(...defaultCallbackArgs.slice(argSlice.length))
        }
        while (argSlice.length < outCount) {
          argSlice.push(null)
        }
        debug.handler[operation](JSON.stringify(requestParams), JSON.stringify(argSlice))
        return callback.apply(null, argSlice)
      })
    }
  }
}


