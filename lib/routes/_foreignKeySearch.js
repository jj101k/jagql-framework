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
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'search')

      const foreignKey = Object.keys(request.params).filter(
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

      const [results, pageData] = await Promisify.promisifyMulti(resourceConfig.handlers, "search")(request)

      const searchResultsIn = results.map(result => ({
        id: '' + result.id,
        type: result.type
      }))
      const searchResults = resourceConfig.attributes[foreignKey] ?
        searchResultsIn[0] || null :
        searchResultsIn

      response = responseHelper._generateResponse(request, resourceConfig, searchResults)
      response.included = [ ]
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    return router.sendResponse(res, response, 200)
  })
}
