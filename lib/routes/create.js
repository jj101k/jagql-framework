'use strict'
const createRoute = module.exports = { }

const _ = {
  assign: require('lodash.assign')
}
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
      const theirResource = _.assign(
        { type: request.params.type },
        (request.resourceConfig.primaryKey === 'uuid') && { id: uuid.v4() },
        (request.resourceConfig.primaryKey === 'autoincrement') && { id: 'DEFAULT' },
        theirs.id && { id: theirs.id }, // Take id from client if provided, but not for autoincrement
        theirs.attributes,
        { meta: theirs.meta }
      )
      for (const i in theirs.relationships) {
        theirResource[i] = theirs.relationships[i].data
      }
      helper.validate(theirResource, resourceConfig.onCreate)

      const [createdResource] = await Promisify.promisifyFull(resourceConfig.handlers.create.bind(resourceConfig.handlers))(request, theirResource)

      request.params.id = '' + createdResource.id
      const [newResource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig))(request)

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
