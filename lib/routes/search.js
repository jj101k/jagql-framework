'use strict'
const searchRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const pagination = require('../pagination.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const { Promisify } = require('../promisify.js')

searchRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type'
  }, async (request, resourceConfig, res) => {
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'search')

      helper.validate(request.params, resourceConfig.searchParams)

      filter.parseAndValidate(request)

      pagination.importPaginationParams(request)

      const [searchResultsIn, paginationInfo] = await Promisify.promisifyMulti(resourceConfig.handlers, "search")(request)
      const searchResults = pagination.enforcePagination(request, searchResultsIn)

      postProcess.fetchForeignKeys(searchResults, resourceConfig.attributes)

      const sanitisedData = await responseHelper._checkSchemaOnArray(searchResults, resourceConfig.attributes)

      response = responseHelper._generateResponse(request, resourceConfig, sanitisedData, paginationInfo)
      response.included = [ ]
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    return router.sendResponse(res, response, 200)
  })
}
