'use strict'
const createRoute = module.exports = { }

const uuid = require('uuid')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const { Promisify } = require('../promisify.js')

createRoute.register = () => {
  router.bindRoute({
    verb: 'post',
    path: ':type'
  }, async (request, resourceConfig, res) => {
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'create')
      helper.verifyRequest(request, resourceConfig, 'find')

      helper.checkForBody(request)

      const theirs = request.params.data
      const theirResource = { type: request.params.type, ...theirs.attributes, meta: theirs.meta }
      if(theirs.id) {
        theirResource.id = theirs.id // Take id from client if provided, but not for autoincrement
      } else if(request.resourceConfig.primaryKey == "uuid") {
        theirResource.id = uuid.v4()
      } else if(request.resourceConfig.primaryKey == "autoincrement") {
        theirResource.id = "DEFAULT"
      }
      for (const i in theirs.relationships) {
        theirResource[i] = theirs.relationships[i].data
      }
      helper.validate(theirResource, resourceConfig.onCreate)

      const createdResource = await Promisify.promisifySingle(resourceConfig.handlers, "create")(request, theirResource)

      request.params.id = '' + createdResource.id
      const newResource = await Promisify.promisifySingle(resourceConfig.handlers, "find")(request)

      postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

      const sanitisedData = await responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes)

      request.route.path += `/${sanitisedData.id}`
      res.set({
        'Location': `${request.route.combined}/${sanitisedData.id}`
      })
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }
    return router.sendResponse(res, response, 201)
  })
}
