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
const { Promisify } = require('../promisify.js')

relatedRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id/:relation'
  }, async (request, resourceConfig, res) => {
    let relation
    let mainResource
    let relatedResources
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'find')

      relation = resourceConfig.attributes[request.params.relation]
      const settings = ourJoi.getSettings(relation)
      if (!(settings?.__one || settings?.__many)) {
        throw {
          status: '404',
          code: 'ENOTFOUND',
          title: 'Resource not found',
          detail: 'The requested relation does not exist within the requested type'
        }
      }
      if (settings.__as) {
        throw {
          status: '404',
          code: 'EFOREIGN',
          title: 'Relation is Foreign',
          detail: 'The requested relation is a foreign relation and cannot be accessed in this manner.'
        }
      }

      pagination.importPaginationParams(request)

      const [resultX] = await Promisify.promisifyFull(resourceConfig.handlers.find).bind(resourceConfig.handlers)(request)
      mainResource = resultX
    } catch(err) {
      return helper.handleError(request, res, err)
    }


    async.waterfall([
      (callback) => {
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
