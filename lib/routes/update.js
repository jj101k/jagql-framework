'use strict'
const updateRoute = module.exports = { }

const async = require('async')
const _ = {
  assign: require('lodash.assign'),
  pick: require('lodash.pick')
}
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')

updateRoute.register = () => {
  router.bindRoute({
    verb: 'patch',
    path: ':type/:id'
  }, (request, resourceConfig, res) => {
    let theirResource
    let newResource
    let response

    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'update', callback)
      },
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'find', callback)
      },
      callback => {
        helper.checkForBody(request, callback)
      },
      callback => {
        const theirs = request.params.data
        theirResource = {
          id: helper.idFromUrl(resourceConfig, request),
          type: request.params.type,
          ...theirs.attributes,
          meta: theirs.meta
        }
        for (const i in theirs.relationships) {
          theirResource[i] = theirs.relationships[i].data
        }
        callback()
      },
      callback => {
        const validationObject = _.pick(resourceConfig.onCreate, Object.keys(theirResource))
        helper.validate(theirResource, validationObject, callback)
      },
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
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback)
      },
      callback => {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback)
      },
      (sanitisedData, callback) => {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      router.sendResponse(res, response, 200)
    })
  })
}
