'use strict'
const relatedRoute = module.exports = { }

const jsonApi = require('../jsonApi.js')
const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const pagination = require('../pagination.js')
const ourJoi = require("../ourJoi.js")

relatedRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id/:relation'
  }, (request, resourceConfig, res) => {
    let relation
    let mainResource
    let relatedResources
    let response

    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'find', callback)
      },
      callback => {
        relation = resourceConfig.attributes[request.params.relation]
        const settings = ourJoi.getSettings(relation)
        if (!(settings?.__one || settings?.__many)) {
          return callback({ // eslint-disable-line standard/no-callback-literal
            status: '404',
            code: 'ENOTFOUND',
            title: 'Resource not found',
            detail: 'The requested relation does not exist within the requested type'
          })
        }
        if (settings.__as) {
          return callback({ // eslint-disable-line standard/no-callback-literal
            status: '404',
            code: 'EFOREIGN',
            title: 'Relation is Foreign',
            detail: 'The requested relation is a foreign relation and cannot be accessed in this manner.'
          })
        }
        callback()
      },
      function validatePaginationParams (callback) {
        pagination.validatePaginationParams(request)
        return callback()
      },
      callback => {
        try {
          resourceConfig.handlers.find(request, callback)
        } catch (e) {
          callback(e)
        }
      },
      (result, callback) => {
        mainResource = result
        postProcess._fetchRelatedResources(request, mainResource, callback)
      },
      (newResources, total, callback) => {
        relatedResources = newResources
        const settings = ourJoi.getSettings(relation)
        if (settings.__one) {
          // if this is a hasOne, then disable pagination meta data.
          total = null
          relatedResources = relatedResources[0]
        }
        request.resourceConfig = (settings.__one || settings.__many).map(resourceName => {
          return jsonApi._resources[resourceName]
        })

        response = responseHelper._generateResponse(request, resourceConfig, relatedResources, total)
        if (relatedResources !== null) {
          response.included = [ ]
        }
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 200)
    })
  })
}
