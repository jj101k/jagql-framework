'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const pagination = require('../pagination.js')
const PromisifyHandler = require('../promisifyHandler.js')
const jsonApiResources = require('../jsonApiResources.js')
const Relationship = require('../Relationship.js')
const RemoteRelationship = require('../RemoteRelationship.js')
const { JsonApiError } = require('../errorHandlers/JsonApiError.js')

module.exports = class relatedRoute {
    static register() {
        router.bindRoute({
            verb: 'get',
            path: ':type/:id/:relationship'
        }, async (request, resourceConfig, res) => {
            /**
             * Compat
             */
            request.params.relation = request.params.relationship
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'find')

            const rel = Relationship.getRelationship(resourceConfig, request.params.relationship)
            if (!rel) {
                throw new JsonApiError({
                    status: 404,
                    code: 'ENOTFOUND',
                    title: 'Resource not found',
                    detail: 'The requested relationship does not exist within the requested type'
                })
            }
            // note that this is also absent from lib/swagger/paths.js
            if (rel instanceof RemoteRelationship) {
                throw new JsonApiError({
                    status: 404,
                    code: 'EFOREIGN',
                    title: 'Relationship is Foreign',
                    detail: 'The requested relationship is a foreign relationship and cannot be accessed in this manner.'
                })
            }

            pagination.importPaginationParams(request)

            const mainResource = await handler.find(request)

            const [newResources, totalIn] = await postProcess.fetchRelatedResources(request, mainResource)

            const { total, relatedResources } = rel.count == "one" ?
                {
                    // if this is a hasOne, then disable pagination meta data.
                    total: null,
                    relatedResources: newResources[0]
                } : {
                    total: totalIn,
                    relatedResources: newResources
                }
            request.resourceConfig = rel.resources.map(resourceName => {
                return jsonApiResources[resourceName]
            })

            response = responseHelper.generateResponse(request, resourceConfig, relatedResources, total)
            if (relatedResources !== null) {
                response.included = []
            }
            await postProcess.handle(request, response)

            return router.sendResponse(res, response, 200)
        })
    }
}