'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')

module.exports = class updateRelationship {
    static register() {
        router.bindRoute({
            verb: 'patch',
            path: ':type/:id/relationships/:relationship'
        }, async (request, resourceConfig, res) => {
            /**
             * Compat
             */
            request.params.relation = request.params.relationship
            let response

            const handler = PromisifyHandler.for(resourceConfig?.handlers)
            helper.verifyRequest(request, resourceConfig, 'update')
            helper.verifyRequest(request, resourceConfig, 'find')

            helper.checkForBody(request)

            const theirs = request.params.data
            const theirResource = {
                id: request.params.id,
                type: request.params.type
            }
            theirResource[request.params.relationship] = theirs

            helper.validateCreateExplicit(theirResource, resourceConfig, ["id", "type", request.params.relationship])

            await handler.update(request, theirResource)
            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig)

            const sanitisedRelationshipData = sanitisedData.relationships[request.params.relationship].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData)
            await postProcess.handle(request, response)

            router.sendResponse(res, response, 200)
        })
    }
}