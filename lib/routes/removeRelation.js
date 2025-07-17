'use strict'
const removeRelationRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const ourJoi = require("../ourJoi.js")

removeRelationRoute.register = () => {
  router.bindRoute({
    verb: 'delete',
    path: ':type/:id/relationships/:relation'
  }, async (request, resourceConfig, res) => {
    let newResource
    let theirResource
    let response

    try {
      await helper.verifyRequest(request, resourceConfig, res, 'update')
      await helper.verifyRequest(request, resourceConfig, res, 'find')
    } catch(err) {
      return helper.handleError(request, res, err)
    }

    async.waterfall([
      callback => {
        helper.checkForBody(request, callback)
      },
      callback => {
        try {
          resourceConfig.handlers.find(request, callback)
        } catch (e) {
          callback(e)
        }
      },
      (ourResource, callback) => { (async () => {
        theirResource = ourResource

        const relSchema = resourceConfig.attributes[request.params.relation]
        const settings = ourJoi.getSettings(relSchema)
        const isMany = settings.__many
        const isOne = settings.__one
        const relationType = isMany || isOne
        let theirs = request.params.data
        if (!(Array.isArray(theirs))) {
          theirs = [ theirs ]
        }

        const theirRelationP = theirResource[request.params.relation]
        let theirRelation = responseHelper._isPromise(theirRelationP)
          ? await theirRelationP : theirRelationP

        const keys = [].concat(theirRelation).map(j => '' + j.id)

        for (let i = 0; i < theirs.length; i++) {
          if (relationType.indexOf(theirs[i].type) === -1) {
            return callback({ // eslint-disable-line standard/no-callback-literal
              status: '403',
              code: 'EFORBIDDEN',
              title: 'Invalid Request',
              detail: `Invalid type ${theirs[i].type}`
            })
          }
          const someId = theirs[i].id
          const indexOfTheirs = keys.indexOf('' + someId)
          if (indexOfTheirs === -1) {
            return callback({ // eslint-disable-line standard/no-callback-literal
              status: '403',
              code: 'EFORBIDDEN',
              title: 'Invalid Request',
              detail: `Unknown id ${someId}`
            })
          }
          if (isMany) {
            theirRelation.splice(indexOfTheirs, 1)
          }
        }

        if (isMany) {
          theirRelation = theirRelation.map(r => ({...r, id: '' + r.id}))
        } else {
          theirRelation = null
        }

        theirResource = {id: '' + theirResource.id,
          type: theirResource.type,
          [request.params.relation]: theirRelation}

        const resourceKeys = new Set(Object.keys(theirResource))
        const validationObject = Object.fromEntries(
          Object.entries(resourceConfig.onCreate).filter(
            ([k]) => resourceKeys.has(k)))

        helper.validate(theirResource, validationObject, callback)
      })().catch(e => callback(e)) },
      callback => {
        try {
          resourceConfig.handlers.update(request, theirResource, callback)
        } catch (e) {
          callback(e)
        }
      },
      (result, callback) => {
        try {
          resourceConfig.handlers.find(request, callback)
        } catch (e) {
          callback(e)
        }
      },
      (result, callback) => {
        newResource = result
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback)
      },
      callback => {
        responseHelper._checkSchemaOnObject(newResource, resourceConfig.attributes, callback).catch(callback)
      },
      (sanitisedData, callback) => {
        sanitisedData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      router.sendResponse(res, response, 200)
    })
  })
}
