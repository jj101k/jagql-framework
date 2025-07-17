'use strict'
const addRelationRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const { Promisify } = require('../promisify.js')

addRelationRoute.register = () => {
  router.bindRoute({
    verb: 'post',
    path: ':type/:id/relationships/:relation'
  }, async (request, resourceConfig, res) => {
    let newResource
    let theirResource
    let response

    let sanitisedData
    try {
      await helper.verifyRequest(request, resourceConfig, res, 'update')
      await helper.verifyRequest(request, resourceConfig, res, 'find')
      await helper.checkForBody(request)
      const [ourResource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      theirResource = JSON.parse(JSON.stringify(ourResource))

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

      helper.validate(theirResource, resourceConfig.onCreate)

      await Promisify.promisify(resourceConfig.handlers.update.bind(resourceConfig.handlers))(request, theirResource)

      const [result] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      newResource = result
      await Promisify.promisify(postProcess.fetchForeignKeys.bind(postProcess))(request, newResource, resourceConfig.attributes)

      const [sanitisedDataX] = await Promisify.promisifyFull(responseHelper._enforceSchemaOnObject.bind(responseHelper))(newResource, resourceConfig.attributes)
      sanitisedData = sanitisedDataX

      sanitisedData = sanitisedData.relationships[request.params.relation].data
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
      await Promisify.promisify(postProcess.handle.bind(postProcess))(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    router.sendResponse(res, response, 201)
  })
}
