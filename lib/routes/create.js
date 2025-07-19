'use strict'
const createRoute = module.exports = { }

const async = require('async')
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
    let theirResource
    let response

    let sanitisedData
    try {
      helper.verifyRequest(request, resourceConfig, 'create')
      helper.verifyRequest(request, resourceConfig, 'find')

      helper.checkForBody(request)

      const theirs = request.params.data
      theirResource = _.assign(
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

      let [newResource] = await Promisify.promisifyFull(resourceConfig.handlers.create.bind(resourceConfig.handlers))(request, theirResource)

      request.params.id = '' + newResource.id
      const [resultX] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig))(request)
      newResource = resultX

      postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

      sanitisedData = await responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    async.waterfall([
      (callback) => {
        request.route.path += `/${sanitisedData.id}`
        res.set({
          'Location': `${request.route.combined}/${sanitisedData.id}`
        })
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 201)
    })
  })
}
