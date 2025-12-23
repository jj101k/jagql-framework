'use strict'
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { helper } from "./helper.js"

/**
 *
 */
export class updateRelationship {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static register(router, configStore, responseHelper, relationshipStore) {
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

            postProcess.stripRemoteRelationships(newResource, resourceConfig, relationshipStore)

            const inferredBaseUrl = request.inferredBaseUrl
            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig, inferredBaseUrl)

            const sanitisedRelationshipData = sanitisedData.relationships[relationshipName].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData, inferredBaseUrl)

            router.sendResponse(res, response, 200)
        })
    }
}