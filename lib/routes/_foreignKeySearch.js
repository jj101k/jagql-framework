'use strict'
const foreignKeySearchRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const { Promisify } = require('../promisify.js')

foreignKeySearchRoute.register = () => {
  const NonForeignKeyParam = new Set(['include', 'type', 'sort', 'filter',
    'fields', 'requestId'])
  router.bindRoute({
    verb: 'get',
    path: ':type/relationships/?'
  }, async (request, resourceConfig, res) => {
    let foreignKey
    let searchResults
    let response

    try {
      await Promisify.promisify(helper.verifyRequest.bind(helper))(request, resourceConfig, res, 'search')

      foreignKey = Object.keys(request.params).filter(
        param => !NonForeignKeyParam.has(param)).pop()
      request.params.relationships = { }
      request.params.relationships[foreignKey] = request.params[foreignKey]
      delete request.params[foreignKey]

      const foreignKeySchema = resourceConfig.attributes[foreignKey]
      const settings = ourJoi.getSettings(foreignKeySchema)
      if (!settings) {
        throw {
          status: '403',
          code: 'EFORBIDDEN',
          title: 'Invalid foreign key lookup',
          detail: `Relation [${foreignKey}] does not exist within ${request.params.type}`
        }
      }
      if (!(settings?.__one || settings?.__many)) {
        throw {
          status: '403',
          code: 'EFORBIDDEN',
          title: 'Invalid foreign key lookup',
          detail: `Attribute [${foreignKey}] does not represent a relation within ${request.params.type}`
        }
      }

      const [results, pageData] = await Promisify.promisifyFull(resourceConfig.handlers.search.bind(resourceConfig.handlers))(request)

      searchResults = results.map(result => ({
        id: '' + result.id,
        type: result.type
      }))
      if (resourceConfig.attributes[foreignKey]) {
        searchResults = searchResults[0] || null
      }

      response = responseHelper._generateResponse(request, resourceConfig, searchResults)
      response.included = [ ]
      await Promisify.promisify(postProcess.handle.bind(postProcess))(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    return router.sendResponse(res, response, 200)
  })
}
