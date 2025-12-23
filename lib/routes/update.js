'use strict'
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { helper } from "./helper.js"

/**
 *
 */
export class updateRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static register(router, configStore, responseHelper, relationshipStore) {
        router.bindRoute({
            verb: 'patch',
            path: ':type/:id'
        }, async (request, resourceConfig, res) => {
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'update')
            helper.verifyRequest(request, resourceConfig, 'find')

            helper.checkForBody(request)

            const theirs = request.body.data
            const theirResource = {
                id: request.routeParams.id,
                type: request.routeParams.type,
                ...theirs.attributes,
                meta: theirs.meta
            }
            for (const i in theirs.relationships) {
                theirResource[i] = theirs.relationships[i].data
            }

            helper.validateCreatePartial(theirResource, resourceConfig)

            await handler.update(request, theirResource)
            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig, relationshipStore)

            const inferredBaseUrl = request.inferredBaseUrl

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig, inferredBaseUrl)

            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, inferredBaseUrl)

            router.sendResponse(res, response, 200)
        })
    }
}