'use strict'
const addRelationRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")

addRelationRoute.register = () => {
  router.bindRoute({
    verb: 'post',
    path: ':type/:id/relationships/:relation'
  }, (request, resourceConfig, res) => {
    let newResource
    let theirResource
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
        try {
          resourceConfig.handlers.find(request, callback)
        } catch (e) {
          callback(e)
        }
      },
      (ourResource, callback) => {
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

        helper.validate(theirResource, resourceConfig.onCreate, callback)
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
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback).catch(callback)
      },
      (sanitisedData, callback) => {
        sanitisedData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      router.sendResponse(res, response, 201)
    })
  })
}
