'use strict'
import { Relationship } from "../Relationship.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { responseHelper } from "../responseHelper.js"
import { tools } from "../tools.js"
import { helper } from "./helper.js"

/**
 *
 */
export class removeRelationship {
    /**
     * @param {import("../Router.js").Router} router
     */
    static register(router) {
        router.bindRoute({
            verb: 'delete',
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

            const theirResource = await handler.find(request)

            const rel = Relationship.getRelationship(resourceConfig, relationshipName)
            const isMany = rel.count == "many"
            const relationshipType = rel.resources
            const theirs = tools.ensureArray(request.body.data)

            const theirRelationshipP = theirResource[relationshipName]
            const theirRelationship = tools.isPromise(theirRelationshipP)
                ? await theirRelationshipP : theirRelationshipP

            const keys = tools.ensureArrayNotNullish(theirRelationship).map(j => '' + j.id)

            for (const theirDatum of theirs) {
                if (relationshipType.indexOf(theirDatum.type) === -1) {
                    throw new JsonApiError({
                        status: 403,
                        code: 'EFORBIDDEN',
                        title: 'Invalid Request',
                        detail: `Invalid type ${theirDatum.type}`
                    })
                }
                const someId = theirDatum.id
                const indexOfTheirs = keys.indexOf('' + someId)
                if (indexOfTheirs === -1) {
                    throw new JsonApiError({
                        status: 403,
                        code: 'EFORBIDDEN',
                        title: 'Invalid Request',
                        detail: `Unknown id ${someId}`
                    })
                }
                if (isMany) {
                    theirRelationship.splice(indexOfTheirs, 1)
                }
            }

            const theirRelationshipSimplified = isMany ?
                theirRelationship.map(r => ({ ...r, id: '' + r.id })) : null

            const update = {
                id: '' + theirResource.id,
                type: theirResource.type,
                [relationshipName]: theirRelationshipSimplified
            }

            helper.validateCreatePartial(update, resourceConfig)

            await handler.update(request, update)

            const newResource = await handler.find(request)

            postProcess.stripRemoteRelationships(newResource, resourceConfig)

            const inferredBaseUrl = request.inferredBaseUrl
            const sanitisedData = await responseHelper.checkSchemaOnObject(newResource, resourceConfig, inferredBaseUrl)

            const sanitisedRelationshipData = sanitisedData.relationships[relationshipName].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData, inferredBaseUrl)

            router.sendResponse(res, response, 200)
        })
    }
}