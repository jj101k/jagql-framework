'use strict'
const helper = module.exports = { }

const Joi = require('joi')
const responseHelper = require('../responseHelper.js')
const router = require('../router.js')
const debug = require('../debugging.js')

/**
 * Compat: Joi 17
 *
 * @param {*} someObject
 * @param {*} someDefinition
 * @throws
 * @returns
 */
helper.validate = (someObject, someDefinition) => {
  debug.validationInput(JSON.stringify(someObject))
  const schema = Joi.compile(someDefinition)
  const result = schema.validate(someObject, { abortEarly: false })
  if (result.error) {
    throw {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Param validation failed',
      detail: result.error.details
    }
  }
  Object.assign(someObject, result.value)
}

helper.checkForBody = (request) => {
  if (!request.params.data) {
    throw {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Request validation failed',
      detail: 'Missing "data" - have you sent the right http headers?'
    }
  }
  // data can be {} or [] both of which are typeof === 'object'
  if (typeof request.params.data !== 'object') {
    throw {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Request validation failed',
      detail: '"data" must be an object - have you sent the right http headers?'
    }
  }
}

/**
 *
 * @param {import('../../types/Handler.js').JsonApiRequest} request
 * @param {*} res
 * @param {*} err
 * @returns
 */
helper.handleError = (request, res, err) => {
  console.error(err)
  const errorResponse = responseHelper.generateError(request, err)
  const httpCode = errorResponse.errors[0].status || 500
  return router.sendResponse(res, errorResponse, httpCode)
}

helper.verifyRequest = (request, resourceConfig, handlerRequest) => {
  if (!resourceConfig) {
    throw {
      status: '404',
      code: 'ENOTFOUND',
      title: 'Resource not found',
      detail: `The requested resource '${request.params.type}' does not exist`
    }
  }

  if (!resourceConfig.handlers.ready) {
    throw {
      status: '503',
      code: 'EUNAVAILABLE',
      title: 'Resource temporarily unavailable',
      detail: `The requested resource '${request.params.type}' is temporarily unavailable`
    }
  }

  // for crud operation support, we need skip over any ChainHandlers to check what the actual store supports
  let finalHandler = resourceConfig.handlers
  while (finalHandler.otherHandler) {
    finalHandler = finalHandler.otherHandler
  }

  if (!finalHandler[handlerRequest]) {
    throw {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Resource not supported',
      detail: `The requested resource '${request.params.type}' does not support '${handlerRequest}'`
    }
  }
}
