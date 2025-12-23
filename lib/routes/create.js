'use strict'
import * as uuid from "uuid"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { helper } from "./helper.js"

/**
 *
 */
export class createRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static register(router, configStore, responseHelper, relationshipStore) {
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

            postProcess.stripRemoteRelationships(newResource, resourceConfig, relationshipStore)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig, request.inferredBaseUrl)

            request.route.path += `/${sanitisedData.id}`
            res.set({
                'Location': `${request.route.combined}/${sanitisedData.id}`
            })
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, request.inferredBaseUrl)
            return router.sendResponse(res, response, 201)
        })
    }
}