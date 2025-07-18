'use strict'
const deleteRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const responseHelper = require('../responseHelper.js')
const { Promisify } = require('../promisify.js')

deleteRoute.register = () => {
  router.bindRoute({
    verb: 'delete',
    path: ':type/:id'
  }, async (request, resourceConfig, res) => {
    try {
      helper.verifyRequest(request, resourceConfig, res, 'delete')

      await Promisify.promisify(resourceConfig.handlers.delete.bind(resourceConfig.handlers))(request)
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    const response = {
      meta: responseHelper._generateMeta(request)
    }
    router.sendResponse(res, response, 200)
  })
}
