'use strict'
const uuid = require('uuid')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')

module.exports = class createRoute {
    static register() {
        router.bindRoute({
            verb: 'post',
            path: ':type'
        }, async (request, resourceConfig, res) => {
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'create')
            helper.verifyRequest(request, resourceConfig, 'find')

            helper.checkForBody(request)

            const theirs = request.body.data
            const theirResource = { type: request.routeParams.type, ...theirs.attributes, meta: theirs.meta }
            if (theirs.id) {
                theirResource.id = theirs.id // Take id from client if provided, but not for autoincrement
            } else if (request.resourceConfig.primaryKey == "uuid") {
                theirResource.id = uuid.v4()
            } else if (request.resourceConfig.primaryKey == "autoincrement") {
                theirResource.id = "DEFAULT"
            }
            for (const i in theirs.relationships) {
                theirResource[i] = theirs.relationships[i].data
            }
            helper.validateCreate(theirResource, resourceConfig)

            const createdResource = await handler.create(request, theirResource)

            request.routeParams.id = '' + createdResource.id

            // Compat only
            request.params.id = request.routeParams.id

            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig)

            request.route.path += `/${sanitisedData.id}`
            res.set({
                'Location': `${request.route.combined}/${sanitisedData.id}`
            })
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData)
            return router.sendResponse(res, response, 201)
        })
    }
}