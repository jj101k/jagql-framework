'use strict'

import { RemoteRelationshipStripper } from "./RemoteRelationshipStripper.js"
import { debug } from "./debug.js"
import { fields } from "./postProcessing/fields.js"
import { includePP } from "./postProcessing/include.js"
import { sortPP } from "./postProcessing/sort.js"
import { rerouter } from "./rerouter.js"
import { tools } from "./tools.js"

/**
 * @template R
 * @typedef {import("./JsonApiRequest.js").JsonApiRouteParams<R>} JsonApiRouteParams<R>
 */
/**
 * @template R
 * @template {JsonApiRouteParams<R>} RP
 * @typedef {import("./JsonApiRequest.js").JsonApiRequest<R, RP>} JsonApiRequest<R,RP>
 */
/**
 * @typedef {import("./ConfigStore.js").ConfigStore} ConfigStore
 * @typedef {import("./JsonApiResponse.js").JsonApiResponseBodyWithMeta} JsonApiResponseBodyWithMeta
 * @typedef {import("./Router.js").Router} Router
 */

/**
 *
 */
export class postProcess {
    /**
     *
     * @param {JsonApiRequest<any, JsonApiRouteParams<any>>} request
     * @returns
     */
    static #getHandlerFromRequest(request) {
        // sometimes the resourceConfig is an object... sometimes it's an array.
        const rc = (request.resourceConfig instanceof Array) ?
            request.resourceConfig[0] : request.resourceConfig
        return rc?.handlers
    }

    /**
     *
     * @template {any} R
     * @param {JsonApiRequest<R, any>} request
     * @param {JsonApiResponseBodyWithMeta} response
     * @param {string} name
     * @param {(request: JsonApiRequest<R, JsonApiRouteParams<R>>, response: JsonApiResponseBodyWithMeta) => *} f
     */
    static async #postProcess(request, response, name, f) {
        request.postProcess = name
        await f(request, response)
        delete request.postProcess
    }

    /**
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest<any, JsonApiRouteParams<any>>} request
     * @param {JsonApiResponseBodyWithMeta} response
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static async handleAny(router, configStore, request, response, relationshipStore) {
        // Same as handleMulti, currently.
        return this.handleMulti(router, configStore, request, response, relationshipStore)
    }

    /**
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest<any, JsonApiRouteParams<any>>} request
     * @param {JsonApiResponseBodyWithMeta} response
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static async handleMulti(router, configStore, request, response, relationshipStore) {
        const handler = this.#getHandlerFromRequest(request)
        if (!handler?.handlesSort) {
            await this.#postProcess(request, response, "sort", (request, response) => sortPP.action(request, response))
        }
        return this.handleSingle(router, configStore, request, response, relationshipStore)
    }

    /**
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest<any, JsonApiRouteParams<any>>} request
     * @param {JsonApiResponseBodyWithMeta} response
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     * @returns
     */
    static async handleSingle(router, configStore, request, response, relationshipStore) {
        // not permitting handlers to skip includes or fields, since these two steps cross the bounds into
        // other handlers' data.
        await this.#postProcess(request, response, "includes",
            (request, response) => includePP.action(router, configStore, request, response, relationshipStore))
        return this.#postProcess(request, response, "fields",
            (request, response) => fields.action(request, response, router.resources))
    }

    /**
     * @template R
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest<R, import("./JsonApiRequest.js").JsonApiRelationshipRouteParams<R>>} request
     * @param {R} mainResource
     * @returns {Promise<[any[], number | null]>}
     */
    static async fetchRelatedResources(router, configStore, request, mainResource) {
        // Fetch the other objects
        const dataItemOrItems = mainResource[request.routeParams.relationship]

        if (!dataItemOrItems) return [[null], null]

        const dataItems = tools.ensureArrayNotNullish(dataItemOrItems)

        const page = request.appParams.page
        const total = dataItems.length
        const dataItemsPage = dataItems.slice(page.offset,
            page.offset + page.limit)

        /**
         * @type {Record<string, string[]>}
         */
        const resourcesByType = {}
        for (const dataItem of dataItemsPage) {
            resourcesByType[dataItem.type] ??= []
            resourcesByType[dataItem.type].push(dataItem.id)
        }

        const baseUrl = request.inferredBaseUrl ?? configStore.config.pathPrefix

        /**
         * URIs compatible with the rerouter
         */
        const resourceUrisToFetch = Object.keys(resourcesByType).map(type => {
            const ids = resourcesByType[type]
            let query = ids.map(id => `filter[id]=${id}`).join("&")
            if (request.route.query) {
                query += `&${request.route.query}`
            }
            return `${baseUrl + type}/?${query}`
        })

        /**
         * @type {any[]}
         */
        const relatedResources = []
        for (const related of resourceUrisToFetch) {
            debug.include(related)

            let body
            try {
                body = await rerouter.route(router, {
                    method: 'GET',
                    uri: related,
                    originalRequest: request,
                    query: {
                        filter: request.query.filter,
                        page: { offset: 0, limit: dataItemsPage.length }
                    },
                })
            } catch (err) {
                debug.include('!!', JSON.stringify(err))
                throw err
            }
            const data = tools.ensureArrayNotNullish(body.data)

            relatedResources.push(...data)
        }
        return [relatedResources, total]
    }

    /**
     * This is generally called once per request. It strips all remote-relationship
     * keys from the response.
     *
     * @template R
     * @param {R[] | R} itemOrItems
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static stripRemoteRelationships(itemOrItems, resourceConfig, relationshipStore) {
        new RemoteRelationshipStripper(resourceConfig, relationshipStore).strip(itemOrItems)
    }
}