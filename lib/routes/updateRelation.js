'use strict'
const updateRelationRoute = module.exports = { }

const _ = {
  assign: require('lodash.assign'),
  pick: require('../pick')
}
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const { Promisify } = require('../promisify.js')

updateRelationRoute.register = () => {
  router.bindRoute({
    verb: 'patch',
    path: ':type/:id/relationships/:relation'
  }, async (request, resourceConfig, res) => {
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'update')
      helper.verifyRequest(request, resourceConfig, 'find')

      helper.checkForBody(request)

      const theirs = request.params.data
      const theirResource = {
        id: request.params.id,
        type: request.params.type
      }
      theirResource[request.params.relation] = theirs
      const validator = _.pick(resourceConfig.onCreate, [ 'id', 'type', request.params.relation ])
      helper.validate(theirResource, validator)

      await Promisify.promisify(resourceConfig.handlers.update.bind(resourceConfig.handlers))(request, theirResource)
      const newResource = await Promisify.promisifySingle(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

      const sanitisedData = await responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes)

      const sanitisedRelationData = sanitisedData.relationships[request.params.relation].data
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedRelationData)
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    router.sendResponse(res, response, 200)
  })
}
