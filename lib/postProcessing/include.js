'use strict'
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { Relationship } from "../Relationship.js"
import { tools } from "../tools.js"
import { IncludeTreeNode } from "./IncludeTreeNode.js"

/**
 * @typedef {import("../../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 * @typedef {import("../../types/Filter.js").FilterSpecByAttrIn} FilterSpecByAttrIn
 * @typedef {import("../ConfigStore.js").ConfigStore} ConfigStore
 * @typedef {import("../Router.js").Router} Router
 */

/**
 *
 */
export class includePP {
    /**
     * Called once per request during post-processing
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest} request
     * @param {import("../../types/JsonApiResponse.js").JsonApiResponseBodyWithMeta} response
     * @returns
     */
    static async action(router, configStore, request, response) {
        const filters = request.query.filter
        const includeIn = request.query.include
        if (!includeIn) return
        const includes = (`${includeIn}`).split(',')

        const includeTree = this.#arrayToTree(router, configStore, request, includes, filters)

        const dataItems = tools.ensureArrayNotNullish(response.data)
        includeTree.clearDataItems()
        includeTree.addDataItems(...dataItems)

        const { dropped } = await includeTree.initialise(request, configStore.config.includeLimit)

        includeTree.clearDataItems()
        /**
         * @type {Set<string>}
         */
        const seen = new Set()
        const uniqueIncluded = includeTree.included.filter(someItem => {
            const k = `${someItem.type}~~${someItem.id}`
            if (seen.has(k)) {
                return false
            } else {
                seen.add(k)
                return true
            }
        })
        const limit = configStore.config.includeLimit ?? Math.pow(2, 32) // Practically unlimited
        response.included = uniqueIncluded.slice(0, limit)
        response.meta ??= {}
        response.meta.include = { dropped: dropped + Math.max(0, uniqueIncluded.length - limit) }
    }

    /**
     * Called once per request during post-processing
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {JsonApiRequest} request
     * @param {string[]} includes
     * @param {FilterSpecByAttrIn | undefined} filters
     * @returns
     */
    static #arrayToTree(router, configStore, request, includes, filters) {
        /**
         * @type {JsonApiError[]}
         */
        const validationErrors = []

        const tree = new IncludeTreeNode(router, configStore, request.resourceConfig)

        for (const include of includes) {
            this.#iterate(router, configStore, include, tree, filters, validationErrors)
        }

        if (validationErrors.length > 0) throw validationErrors
        return tree
    }

    /**
     * Called once per include during post-processing
     *
     * @param {Router} router
     * @param {ConfigStore} configStore
     * @param {string} text
     * @param {IncludeTreeNode} includeTree
     * @param {FilterSpecByAttrIn | undefined} filter
     * @param {JsonApiError[]} validationErrors
     * @returns
     */
    static #iterate(router, configStore, text, includeTree, filter, validationErrors) {
        if (text.length === 0) return null
        const parts = text.split('.')
        const relationship = parts.shift()
        const rest = parts.join('.')
        if (!filter) filter = {}

        const activeResourceConfig = includeTree.firstResourceWithRelationship(relationship)
        if (!activeResourceConfig) {
            return validationErrors.push(new JsonApiError({
                status: 403,
                code: 'EFORBIDDEN',
                title: 'Invalid inclusion',
                detail: `${includeTree.resourceTypes.join(" | ")} do not have property ${relationship}`
            }))
        }
        const rel = Relationship.getRelationship(activeResourceConfig, relationship)

        if (!rel) {
            return validationErrors.push(new JsonApiError({
                status: 403,
                code: 'EFORBIDDEN',
                title: 'Invalid inclusion',
                detail: `${activeResourceConfig.resource}.${relationship} is not a relationship and cannot be included`
            }))
        }
        const resourceAttribute = rel.resourceNames

        /**
         * @type {import("../../types/Filter.js").FilterSpecIn}
         */
        const filterRelationship = filter[relationship]

        const nextFilter = Array.isArray(filterRelationship) ?
            filterRelationship.filter(i => i instanceof Object).pop() :
            (filterRelationship ?? {})

        const child = includeTree.ensureChild(relationship, () => {
            const child = new IncludeTreeNode(router, configStore, resourceAttribute.map(a => router.resources[a]))

            if (nextFilter && (!Array.isArray(nextFilter) || nextFilter.length !== 0)) {
                for (const [i, f] of Object.entries(nextFilter)) {
                    if (typeof f !== 'string' && !Array.isArray(f)) continue
                    child.addFilter(i, f)
                }
            }

            return child
        })
        this.#iterate(router, configStore, rest, child, nextFilter, validationErrors)
    }
}