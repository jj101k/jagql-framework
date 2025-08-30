'use strict'
const debug = require('./debugging.js')

/**
 * @typedef {import("../types/PromiseHandler.js").PromiseHandler} PromiseHandler
 */

/**
 * This adds logging to all handler endpoints
 */
module.exports = class handlerEnforcer {
  /**
   *
   * @param {PromiseHandler}
   */
  static wrap(handlers) {
    return new handlerEnforcer(handlers)
  }

  #handlers

  /**
   *
   * @param {string} operation
   * @param {number} outCount
   * @returns
   */
  #wrapHandler(operation, outCount) {
    if (typeof outCount !== 'number') {
      throw new Error('Invalid use of this.#wrapHandler!')
    }

    if (!this.#handlers[operation]) return null
    const defaultCallbackArgs = [...new Array(outCount)].map(() => null)
    /**
     * @param {import('../types/JsonApiRequest.js').JsonApiRequest} request
     * @param {*} handlerArgs
     */
    return async (request, ...handlerArgs) => {
      const requestParams = {...request.body, ...request.query, ...request.routeParams}
      const callbackArgs = await this.#handlers[operation](request, ...handlerArgs)
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
      return argSlice
    }
  }

  /**
   *
   * @param {PromiseHandler}
   */
  constructor(handlers) {
    this.#handlers = handlers

    this.search = this.#wrapHandler('search', 3)
    this.find = this.#wrapHandler('find', 2)
    this.create = this.#wrapHandler('create', 2)
    this.update = this.#wrapHandler('update', 2)
    this.delete = this.#wrapHandler('delete', 1)

    this.close = this.#wrapHandler("close", 0)
    this.initialise = this.#wrapHandler("initialise", 0)
  }
}


