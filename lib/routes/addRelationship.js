'use strict'
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { Relationship } from "../Relationship.js"
import { responseHelper } from "../responseHelper.js"
import { helper } from "./helper.js"

/**
 *
 */
export class addRelationship {
    /**
     * @param {import("../Router.js").Router} router
     */
    static register(router) {
        router.bindRoute({
            verb: 'post',
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
            const ourResource = await handler.find(request)

            const theirResource = JSON.parse(JSON.stringify(ourResource))

            const theirs = request.body.data

            const rel = Relationship.getRelationship(resourceConfig, relationshipName)
            if (rel.count == "many") {
                theirResource[relationshipName] = [
                    ...(theirResource[relationshipName] || []),
                    theirs,
                ]
            } else {
                theirResource[relationshipName] = theirs
            }

            helper.validateCreate(theirResource, resourceConfig)

            await handler.update(request, theirResource)

            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const sanitisedData = await responseHelper.enforceSchemaOnObject(newResource, resourceConfig, request.inferredBaseUrl)

            const sanitisedRelationshipData = sanitisedData.relationships[relationshipName].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData, request.inferredBaseUrl)

            router.sendResponse(res, response, 201)
        })
    }
}