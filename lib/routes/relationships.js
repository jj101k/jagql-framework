'use strict'

const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')
const Relationship = require('../Relationship.js')
const { JsonApiError } = require('../errorHandlers/JsonApiError.js')

module.exports = class relationshipsRoute {
    static register() {
        router.bindRoute({
            verb: 'get',
            path: ':type/:id/relationships/:relationship'
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

            const resource = await handler.find(request)

            postProcess.stripRemoteRelationships(resource, resourceConfig)

            const sanitisedData = await responseHelper.checkSchemaOnObject(resource, resourceConfig)

            if (!sanitisedData) {
                throw new JsonApiError({
                    status: 404,
                    code: 'EVERSION',
                    title: 'Resource is not valid',
                    detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
                })
            }
            const sanitisedRelationshipData = sanitisedData.relationships[request.params.relationship].data
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedRelationshipData)

            return router.sendResponse(res, response, 200)
        })
    }
}