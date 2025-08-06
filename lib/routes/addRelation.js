'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const PromisifyHandler = require('../promisifyHandler.js')

module.exports = class addRelationRoute {
  static register() {
    router.bindRoute({
      verb: 'post',
      path: ':type/:id/relationships/:relation'
    }, async (request, resourceConfig, res) => {
      let response

      const handler = new PromisifyHandler(resourceConfig?.handlers)

      try {
        helper.verifyRequest(request, resourceConfig, 'update')
        helper.verifyRequest(request, resourceConfig, 'find')
        helper.checkForBody(request)
        const ourResource = await handler.find(request)

        const theirResource = JSON.parse(JSON.stringify(ourResource))

        const theirs = request.params.data

        const settings = ourJoi.getSettings(
          resourceConfig.attributes[request.params.relation]
        )
        if (settings.__many) {
          theirResource[request.params.relation] = theirResource[request.params.relation] || [ ]
          theirResource[request.params.relation].push(theirs)
        } else {
          theirResource[request.params.relation] = theirs
        }

        helper.validateCreate(theirResource, resourceConfig)

        await handler.update(request, theirResource)

        const newResource = await handler.find(request)

        postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

        const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig.attributes)

        const sanitisedRelationData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedRelationData)
        await postProcess.handle(request, response)
      } catch(err) {
        return helper.handleError(request, res, err)
      }

      router.sendResponse(res, response, 201)
    })
  }
}