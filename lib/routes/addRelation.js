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
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'update')
      helper.verifyRequest(request, resourceConfig, 'find')
      helper.checkForBody(request)
      const [ourResource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

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

      helper.validate(theirResource, resourceConfig.onCreate)

      await Promisify.promisify(resourceConfig.handlers.update.bind(resourceConfig.handlers))(request, theirResource)

      const [newResource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

      let sanitisedData = await responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes)

      sanitisedData = sanitisedData.relationships[request.params.relation].data
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    router.sendResponse(res, response, 201)
  })
}
