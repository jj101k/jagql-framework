'use strict'
const findRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')

findRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id'
  }, async (request, resourceConfig, res) => {
    let response
    const handler = new PromisifyHandler(resourceConfig?.handlers)

    try {
      helper.verifyRequest(request, resourceConfig, 'find')

      filter.parseAndValidate(request)

      const resource = await handler.find(request)

      postProcess.fetchForeignKeys(resource, resourceConfig.attributes)

      const sanitisedData = resourceConfig.options?.enforceSchemaOnGet ?
        await responseHelper._enforceSchemaOnObject(resource,
          resourceConfig.attributes) :
        await responseHelper._checkSchemaOnObject(resource,
          resourceConfig.attributes)

      if (!sanitisedData) {
        throw {
          status: '404',
          code: 'EVERSION',
          title: 'Resource is not valid',
          detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
        }
      }
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
      response.included = [ ]
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    return router.sendResponse(res, response, 200)
  })
}
