'use strict'
const findRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const { Promisify } = require('../promisify.js')

findRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id'
  }, async (request, resourceConfig, res) => {
    let response

    let sanitisedData
    try {
      helper.verifyRequest(request, resourceConfig, 'find')

      filter.parseAndValidate(request)

      const [resource] = await Promisify.promisifyFull(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      postProcess.fetchForeignKeys(resource, resourceConfig.attributes)

      if(resourceConfig.options?.enforceSchemaOnGet) {
        sanitisedData = await responseHelper._enforceSchemaOnObject(resource,
          resourceConfig.attributes)
      } else {
        sanitisedData = await responseHelper._checkSchemaOnObject(resource,
          resourceConfig.attributes)
      }
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
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        response.included = [ ]
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 200)
    })
  })
}
