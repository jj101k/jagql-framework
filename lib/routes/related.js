'use strict'

import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { pagination } from "../pagination.js"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { Relationship } from "../Relationship.js"
import { RemoteRelationship } from "../RemoteRelationship.js"
import { helper } from "./helper.js"

/**
 *
 */
export class relatedRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static register(router, configStore, responseHelper, relationshipStore) {
        router.bindRoute({
            verb: 'get',
            path: ':type/:id/:relationship'
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
            // note that this is also absent from lib/swagger/paths.js
            if (RemoteRelationship.isRemoteRelationship(rel)) {
                throw new JsonApiError({
                    status: 404,
                    code: 'EFOREIGN',
                    title: 'Relationship is Foreign',
                    detail: 'The requested relationship is a foreign relationship and cannot be accessed in this manner.'
                })
            }

            request.appParams.page = pagination.guaranteedPaginationParams(request)

            // Compat only
            request.params.page = request.appParams.page

            const mainResource = await handler.find(request)

            const [newResources, totalIn] = await postProcess.fetchRelatedResources(router, configStore, request, mainResource)

            const { total, relatedResources } = rel.count == "one" ?
                {
                    // if this is a hasOne, then disable pagination meta data.
                    total: null,
                    relatedResources: newResources[0]
                } : {
                    total: totalIn,
                    relatedResources: newResources
                }
            request.resourceConfig = rel.resourceNames.map(resourceName => router.resources[resourceName])

            response = responseHelper.generateResponse(request, resourceConfig, relatedResources, total)
            if (relatedResources !== null) {
                response.included = []
            }
            await postProcess.handleAny(router, configStore, request, response, relationshipStore)

            return router.sendResponse(res, response, 200)
        })
    }
}