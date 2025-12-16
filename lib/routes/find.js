'use strict'

import { RequestFilter } from "../RequestFilter.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { responseHelper } from "../responseHelper.js"
import { helper } from "./helper.js"

/**
 *
 */
export class findRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     */
    static register(router, configStore) {
        router.bindRoute({
            verb: 'get',
            path: ':type/:id'
        }, async (request, resourceConfig, res) => {
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'find')

            RequestFilter.parseAndValidate(request)

            const resource = await handler.find(request)

            postProcess.stripRemoteRelationships(resource, resourceConfig)

            const inferredBaseUrl = request.inferredBaseUrl
            const sanitisedData = resourceConfig.options?.enforceSchemaOnGet ?
                await responseHelper.enforceSchemaOnObject(resource,
                    resourceConfig, inferredBaseUrl) :
                await responseHelper.checkSchemaOnObject(resource,
                    resourceConfig, inferredBaseUrl)

            if (!sanitisedData) {
                throw new JsonApiError({
                    status: 404,
                    code: 'EVERSION',
                    title: 'Resource is not valid',
                    detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
                })
            }
            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, inferredBaseUrl)
            response.included = []
            await postProcess.handleSingle(router, configStore, request, response)

            return router.sendResponse(res, response, 200)
        })
    }
}