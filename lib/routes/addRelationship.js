'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')
const Relationship = require('../Relationship.js')

module.exports = class addRelationship {
    static register() {
        router.bindRoute({
            verb: 'post',
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
            const ourResource = await handler.find(request)

            const theirResource = JSON.parse(JSON.stringify(ourResource))

            const theirs = request.params.data

            const rel = Relationship.getRelationship(resourceConfig, request.params.relationship)
            if (rel.count == "many") {
                theirResource[request.params.relationship] = theirResource[request.params.relationship] || []
                theirResource[request.params.relationship].push(theirs)
            } else {
                theirResource[request.params.relationship] = theirs
            }

            helper.validateCreate(theirResource, resourceConfig)

            await handler.update(request, theirResource)

            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig)

            const sanitisedRelationshipData = sanitisedData.relationships[request.params.relationship].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData)
            await postProcess.handle(request, response)

            router.sendResponse(res, response, 201)
        })
    }
}