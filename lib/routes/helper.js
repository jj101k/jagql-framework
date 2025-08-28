'use strict'
const Joi = require('joi')
const responseHelper = require('../responseHelper.js')
const router = require('../router.js')
const debug = require('../debugging.js')
const { JsonApiError } = require('../errorHandlers/JsonApiError.js')

/**
 * @typedef {import('../types/JsonApiRequest.js').JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
module.exports = class helper {
  /**
   * Compat: Joi 17
   *
   * @param {*} someObject
   * @param {*} someDefinition
   * @throws
   * @returns
   */
  static validate(someObject, someDefinition) {
    debug.validationInput(JSON.stringify(someObject))
    const schema = Joi.compile(someDefinition)
    const result = schema.validate(someObject, { abortEarly: false })
    if (result.error) {
      throw new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Param validation failed',
        detail: result.error.details.map(d => d.message).join("; "),
        meta: {details: result.error.details}
      })
    }
    Object.assign(someObject, result.value)
  }

  /**
   *
   * @template R
   * @param {*} someObject
   * @param {import('../../types/ResourceConfig.js').ResourceConfig<R>} resourceConfig
   */
  static validateCreate(someObject, resourceConfig) {
    return this.validate(someObject, resourceConfig.onCreate)
  }

  /**
   *
   * @template R
   * @param {*} someObject
   * @param {import('../../types/ResourceConfig.js').ResourceConfig<R>} resourceConfig
   * @param {keyof typeof someObject} [keys]
   */
  static validateCreateExplicit(someObject, resourceConfig, keys) {
    const explicitKeys = new Set(keys)
    const validationObject = Object.fromEntries(Object.entries(resourceConfig.onCreate).filter(
      ([k]) => explicitKeys.has(k)))
    return this.validate(someObject, validationObject)
  }

  /**
   *
   * @template R
   * @param {*} someObject
   * @param {import('../../types/ResourceConfig.js').ResourceConfig<R>} resourceConfig
   */
  static validateCreatePartial(someObject, resourceConfig) {
    const resourceKeys = new Set(Object.keys(someObject))
    const validationObject = Object.fromEntries(Object.entries(resourceConfig.onCreate).filter(
      ([k]) => resourceKeys.has(k)))
    return this.validate(someObject, validationObject)
  }

  /**
   *
   * @template R
   * @param {JsonApiRequest} request
   * @param {import('../../types/ResourceConfig.js').ResourceConfig<R>} resourceConfig
   * @returns
   */
  static validateSearch(request, resourceConfig) {
    return this.validate(request.params, resourceConfig.searchParams)
  }

  static checkForBody(request) {
    if (!request.params.data) {
      throw new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Request validation failed',
        detail: 'Missing "data" - have you sent the right http headers?'
      })
    }
    // data can be {} or [] both of which are typeof === 'object'
    if (typeof request.params.data !== 'object') {
      throw new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Request validation failed',
        detail: '"data" must be an object - have you sent the right http headers?'
      })
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {*} res
   * @param {JsonApiError | JsonApiError[]} errOrErrs
   * @returns
   */
  static handleError(request, res, errOrErrs) {
    console.error(errOrErrs)
    const errorResponse = responseHelper.generateError(request, errOrErrs)
    const httpCode = errorResponse.errors[0].status || 500
    return router.sendResponse(res, errorResponse, +httpCode)
  }

  static verifyRequest(request, resourceConfig, handlerRequest) {
    if (!resourceConfig) {
      throw new JsonApiError({
        status: 404,
        code: 'ENOTFOUND',
        title: 'Resource not found',
        detail: `The requested resource '${request.params.type}' does not exist`
      })
    }

    if (!resourceConfig.handlers.ready) {
      throw new JsonApiError({
        status: 503,
        code: 'EUNAVAILABLE',
        title: 'Resource temporarily unavailable',
        detail: `The requested resource '${request.params.type}' is temporarily unavailable`
      })
    }

    // for crud operation support, we need skip over any ChainHandlers to check what the actual store supports
    let finalHandler = resourceConfig.handlers
    while (finalHandler.otherHandler) {
      finalHandler = finalHandler.otherHandler
    }

    if (!finalHandler[handlerRequest]) {
      throw new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Resource not supported',
        detail: `The requested resource '${request.params.type}' does not support '${handlerRequest}'`
      })
    }
  }
}