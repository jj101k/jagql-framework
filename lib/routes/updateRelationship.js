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
            const relationshipName = request.routeParams.relationship

            // Compat only
            request.params.relation = relationshipName

            let response

            const handler = PromisifyHandler.for(resourceConfig?.handlers)
            helper.verifyRequest(request, resourceConfig, 'update')
            helper.verifyRequest(request, resourceConfig, 'find')

            helper.checkForBody(request)

            const theirs = request.body.data
            const theirResource = {
                id: request.routeParams.id,
                type: request.routeParams.type
            }
            theirResource[relationshipName] = theirs

            helper.validateCreateExplicit(theirResource, resourceConfig, ["id", "type", relationshipName])

            await handler.update(request, theirResource)
            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig)

            const sanitisedRelationshipData = sanitisedData.relationships[relationshipName].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData)

            router.sendResponse(res, response, 200)
        })
    }
}