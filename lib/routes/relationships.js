'use strict'

import { Relationship } from "../Relationship.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { helper } from "./helper.js"

/**
 *
 */
export class relationshipsRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static register(router, configStore, responseHelper, relationshipStore) {
        router.bindRoute({
            verb: 'get',
            path: ':type/:id/relationships/:relationship'
        }, async (request, resourceConfig, res) => {
            const relationshipName = request.routeParams.relationship

            // Compat only
            request.params.relation = relationshipName

            let response

            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'find')

            const rel = Relationship.getRelationship(resourceConfig, relationshipName, relationshipStore)
            if (!rel) {
                throw new JsonApiError({
                    status: 404,
                    code: 'ENOTFOUND',
                    title: 'Resource not found',
                    detail: 'The requested relationship does not exist within the requested type'
                })
            }

            const resource = await handler.find(request)

            postProcess.stripRemoteRelationships(resource, resourceConfig, relationshipStore)

            const inferredBaseUrl = request.inferredBaseUrl
            const sanitisedData = await responseHelper.checkSchemaOnObject(resource, resourceConfig, inferredBaseUrl)

            if (!sanitisedData) {
                throw new JsonApiError({
                    status: 404,
                    code: 'EVERSION',
                    title: 'Resource is not valid',
                    detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
                })
            }
            const sanitisedRelationshipData = sanitisedData.relationships[relationshipName].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData, inferredBaseUrl)

            return router.sendResponse(res, response, 200)
        })
    }
}