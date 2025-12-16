"use strict"

import { ArraySchemaChecker } from "../ArraySchemaChecker.js"
import { DataItemInfo } from "../DataItemInfo.js"
import { FilterHelper } from "../FilterHelper.js"
import { PaginationEnforcer } from "../PaginationEnforcer.js"
import { RemoteRelationshipStripper } from "../RemoteRelationshipStripper.js"
import { RequestFilter } from "../RequestFilter.js"
import { pagination } from "../pagination.js"
import { postProcess } from "../postProcess.js"
import { PromisifyHandler } from "../promisifyHandler.js"
import { responseHelper } from "../responseHelper.js"
import { helper } from "./helper.js"

/**
 *
 */
export class searchRoute {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     */
    static register(router, configStore) {
        router.bindRoute({
            verb: "GET",
            path: ":type"
        }, async (request, resourceConfig, res) => {
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, "search")

            helper.validateSearch(request, resourceConfig)

            RequestFilter.parseAndValidate(request)

            request.appParams.page = pagination.guaranteedPaginationParams(request)

            // Compat only
            request.params.page = request.appParams.page

            const r = handler.search(request)

            const paginationEnforcer = new PaginationEnforcer(request)
            const schemaChecker = new ArraySchemaChecker(resourceConfig)
            const dataItemInfo = new DataItemInfo(resourceConfig)

            /**
             * @type {import("../../types/JsonApiResponse.js").JsonApiResourceObject[]}
             */
            let sanitisedData
            /**
             * @type {number}
             */
            let paginationInfo
            const filterF = FilterHelper.getHelper(handler, request, resourceConfig)

            const inferredBaseUrl = request.inferredBaseUrl

            if("next" in r) {
                sanitisedData = []
                paginationInfo = 0
                const relStripper = new RemoteRelationshipStripper(resourceConfig)
                for await (const [sr, pi] of r) {
                    const [filteredChunk, filteredTotal] = filterF.filter(sr, pi)
                    const page = paginationEnforcer.enforce(filteredChunk)
                    relStripper.strip(page)
                    sanitisedData.push(...await responseHelper.generateDataItems(page, dataItemInfo, inferredBaseUrl))
                    paginationInfo += filteredTotal
                    if(!schemaChecker.exhausted) {
                        await schemaChecker.check(...page)
                    }
                    if(paginationEnforcer.exhausted) {
                        break
                    }
                }
            } else {
                const [searchResultsIn, paginationInfoIn] = await r
                /**
                 * @type {typeof searchResultsIn}
                 */
                let searchResultsFiltered
                [searchResultsFiltered, paginationInfo] = filterF.filter(searchResultsIn, paginationInfoIn)
                const searchResults = paginationEnforcer.enforce(searchResultsFiltered)
                postProcess.stripRemoteRelationships(searchResults, resourceConfig)
                await schemaChecker.check(...searchResults)
                sanitisedData = await responseHelper.generateDataItems(searchResults, dataItemInfo, inferredBaseUrl)
            }

            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, paginationInfo)
            response.included = []
            await postProcess.handleMulti(router, configStore, request, response)

            return router.sendResponse(res, response, 200)
        })
    }
}