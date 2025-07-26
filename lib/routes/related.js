'use strict'
const relatedRoute = module.exports = { }

const jsonApi = require('../jsonApi.js')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const pagination = require('../pagination.js')
const ourJoi = require("../ourJoi.js")
const PromisifyHandler = require('../promisifyHandler.js')

relatedRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id/:relation'
  }, async (request, resourceConfig, res) => {
    let response
    const handler = new PromisifyHandler(resourceConfig?.handlers)

    try {
      helper.verifyRequest(request, resourceConfig, 'find')

      const relation = resourceConfig.attributes[request.params.relation]
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

      const mainResource = await handler.find(request)

      const [newResources, totalIn] = await postProcess._fetchRelatedResources(request, mainResource)

      const {total, relatedResources} = settings.__one ?
        {
          // if this is a hasOne, then disable pagination meta data.
          total: null,
          relatedResources: newResources[0]
        } : {
          total: totalIn,
          relatedResources: newResources
        }
      request.resourceConfig = (settings.__one || settings.__many).map(resourceName => {
        return jsonApi._resources[resourceName]
      })

      response = responseHelper._generateResponse(request, resourceConfig, relatedResources, total)
      if (relatedResources !== null) {
        response.included = [ ]
      }
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }
    return router.sendResponse(res, response, 200)
  })
}
