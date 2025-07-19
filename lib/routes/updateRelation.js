'use strict'
const updateRelationRoute = module.exports = { }

const async = require('async')
const _ = {
  assign: require('lodash.assign'),
  pick: require('../pick')
}
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')

updateRelationRoute.register = () => {
  router.bindRoute({
    verb: 'patch',
    path: ':type/:id/relationships/:relation'
  }, (request, resourceConfig, res) => {
    let newResource
    let theirResource
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'update')
      helper.verifyRequest(request, resourceConfig, 'find')

      helper.checkForBody(request)

      const theirs = request.params.data
      theirResource = {
        id: request.params.id,
        type: request.params.type
      }
      theirResource[request.params.relation] = theirs
      const validator = _.pick(resourceConfig.onCreate, [ 'id', 'type', request.params.relation ])
      helper.validate(theirResource, validator)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    async.waterfall([
      callback => {
        try {
          resourceConfig.handlers.update(request, theirResource, callback)
        } catch (e) {
          callback(e)
        }
      },
      (result, callback) => {
        try {
          resourceConfig.handlers.find(request, callback)
        } catch (e) {
          callback(e)
        }
      },
      (result, callback) => {
        newResource = result
        postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)
        callback()
      },
      callback => {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback).catch(callback)
      },
      (sanitisedData, callback) => {
        sanitisedData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      router.sendResponse(res, response, 200)
    })
  })
}
