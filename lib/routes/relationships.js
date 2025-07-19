'use strict'
const relationshipsRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const { Promisify } = require('../promisify.js')

relationshipsRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id/relationships/:relation'
  }, async (request, resourceConfig, res) => {
    let response

    let sanitisedData
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

      const [resource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      postProcess.fetchForeignKeys(resource, resourceConfig.attributes)

      sanitisedData = await responseHelper._checkSchemaOnObject(resource, resourceConfig.attributes)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    async.waterfall([
      (callback) => {
        if (!sanitisedData) {
          return callback({ // eslint-disable-line standard/no-callback-literal
            status: '404',
            code: 'EVERSION',
            title: 'Resource is not valid',
            detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
          })
        }
        sanitisedData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        callback()
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 200)
    })
  })
}
