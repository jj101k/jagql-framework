'use strict'

const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const PromisifyHandler = require('../promisifyHandler.js')

module.exports = class relationshipsRoute {
  static register() {
    router.bindRoute({
      verb: 'get',
      path: ':type/:id/relationships/:relation'
    }, async (request, resourceConfig, res) => {
      let response

      const handler = new PromisifyHandler(resourceConfig?.handlers)

      try {
        helper.verifyRequest(request, resourceConfig, 'find')

        const settings = ourJoi.getAttributeSettings(resourceConfig, request.params.relation)
        if (!(settings?.__one || settings?.__many)) {
          throw {
            status: '404',
            code: 'ENOTFOUND',
            title: 'Resource not found',
            detail: 'The requested relation does not exist within the requested type'
          }
        }

        const resource = await handler.find(request)

        postProcess.fetchForeignKeys(resource, resourceConfig.attributes)

        const sanitisedData = await responseHelper.checkSchemaOnObject(resource, resourceConfig.attributes)

        if (!sanitisedData) {
          throw {
            status: '404',
            code: 'EVERSION',
            title: 'Resource is not valid',
            detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
          }
        }
        const sanitisedRelationshipData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedRelationshipData)
      } catch(err) {
        return helper.handleError(request, res, err)
      }
      return router.sendResponse(res, response, 200)
    })
  }
}