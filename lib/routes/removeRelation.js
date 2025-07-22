'use strict'
const removeRelationRoute = module.exports = { }

const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")
const { Promisify } = require('../promisify.js')

removeRelationRoute.register = () => {
  router.bindRoute({
    verb: 'delete',
    path: ':type/:id/relationships/:relation'
  }, async (request, resourceConfig, res) => {
    let response

    try {
      helper.verifyRequest(request, resourceConfig, 'update')
      helper.verifyRequest(request, resourceConfig, 'find')

      helper.checkForBody(request)

      const theirResource = await Promisify.promisifySingle(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      const relSchema = resourceConfig.attributes[request.params.relation]
      const settings = ourJoi.getSettings(relSchema)
      const isMany = settings.__many
      const isOne = settings.__one
      const relationType = isMany || isOne
      const theirs = Array.isArray(request.params.data) ? request.params.data : [request.params.data]

      const theirRelationP = theirResource[request.params.relation]
      const theirRelation = responseHelper._isPromise(theirRelationP)
        ? await theirRelationP : theirRelationP

      const keys = [].concat(theirRelation).map(j => '' + j.id)

      for (const theirDatum of theirs) {
        if (relationType.indexOf(theirDatum.type) === -1) {
          throw {
            status: '403',
            code: 'EFORBIDDEN',
            title: 'Invalid Request',
            detail: `Invalid type ${theirDatum.type}`
          }
        }
        const someId = theirDatum.id
        const indexOfTheirs = keys.indexOf('' + someId)
        if (indexOfTheirs === -1) {
          throw {
            status: '403',
            code: 'EFORBIDDEN',
            title: 'Invalid Request',
            detail: `Unknown id ${someId}`
          }
        }
        if (isMany) {
          theirRelation.splice(indexOfTheirs, 1)
        }
      }

      const theirRelationSimplified = isMany ?
        theirRelation.map(r => ({...r, id: '' + r.id})) : null

      const update = {id: '' + theirResource.id,
        type: theirResource.type,
        [request.params.relation]: theirRelationSimplified}

      const resourceKeys = new Set(Object.keys(update))
      const validationObject = Object.fromEntries(
        Object.entries(resourceConfig.onCreate).filter(
          ([k]) => resourceKeys.has(k)))

      helper.validate(update, validationObject)

      await Promisify.promisify(resourceConfig.handlers.update.bind(resourceConfig.handlers))(request, update)

      const newResource = await Promisify.promisifySingle(resourceConfig.handlers.find.bind(resourceConfig.handlers))(request)

      postProcess.fetchForeignKeys(newResource, resourceConfig.attributes)

      const sanitisedData = await responseHelper._checkSchemaOnObject(newResource, resourceConfig.attributes)

      const sanitisedRelationData = sanitisedData.relationships[request.params.relation].data
      response = responseHelper._generateResponse(request, resourceConfig, sanitisedRelationData)
      await postProcess.handle(request, response)
    } catch(err) {
      return helper.handleError(request, res, err)
    }
    router.sendResponse(res, response, 200)
  })
}
