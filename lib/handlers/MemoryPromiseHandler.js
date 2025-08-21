'use strict'
const { Handler } = require('./Handler')
const Joi = require("joi")
const Prop = require('../Prop')
const { JsonApiError } = require('../errorHandlers/JsonApiError')

/**
 * @template {{id: string}} R
 */
class MemoryPromiseHandler extends Handler {
    /**
     * @template R
     * @param {R} objOrObjs
     * @returns {R}
     */
    static #clone(objOrObjs) {
        return JSON.parse(JSON.stringify(objOrObjs))
    }
    /**
     * @template {{id: string}} R
     * @param {R[]} list
     * @param {R} obj
     * @returns
     */
    static #indexOf(list, obj) {
        for (const i of list.keys()) {
            if (list[i].id === obj.id) return i
        }
        return -1
    }

    /**
     * @type {Record<string, R[]>}
     */
    #resources = {}

    /**
     *
     * @param {R[]} resources
     * @param {string | string[]} [idFilter]
     * @returns
     */
    #filterResources(resources, idFilter) {
        if (!idFilter) {
            return resources
        }
        if (Array.isArray(idFilter)) {
            const idFilterMatch = new Set(idFilter)
            return resources.filter(resource => idFilterMatch.has(resource.id))
        } else {
            return resources.filter(resource => resource.id === idFilter)
        }
    }

    /**
     *
     * @param {R[]} resultSet
     * @param {{offset: number, limit: number}} [page]
     * @returns
     */
    #paginateResultSet(resultSet, page) {
        if (page) {
            return resultSet.slice(page.offset, page.offset + page.limit)
        } else {
            return resultSet
        }
    }

    /**
     *
     * @param {string} sortSpecRendered
     * @returns {{ascending: number, attribute: string & keyof R}}
     */
    #parseSortSpec(sortSpecRendered) {
        if (sortSpecRendered.startsWith("-")) {
            return { ascending: -1, attribute: sortSpecRendered.substring(1) }
        } else {
            return { ascending: 1, attribute: sortSpecRendered }
        }
    }

    /**
     * Internal helper function to sort data
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     * @param {R[]} list
     */
    #sortList(request, list) {
        const sortSpec = request.params.sort
        if (!sortSpec) return

        const { ascending, attribute } = this.#parseSortSpec(`${sortSpec}`)

        list.sort((a, b) => {
            const av = a[attribute]
            if (typeof av === 'string') {
                /**
                 * @type {typeof av}
                 */
                const bv = b[attribute]
                return av.localeCompare(bv) * ascending
            } else if (typeof av === 'number') {
                /**
                 * @type {typeof av}
                 */
                const bv = b[attribute]
                return (av - bv) * ascending
            } else {
                return 0
            }
        })
    }

    /**
     *
     */
    constructor() {
        super()
        this.handlesSort = true
    }

    /**
     * Create (store) a new resource given a resource type and an object.
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     * @param {R} newResource
     */
    create(request, newResource) {
        // Check to see if the ID already exists
        const index = MemoryPromiseHandler.#indexOf(this.#resources[request.params.type], newResource)
        if (index !== -1) {
            throw new JsonApiError({
                status: 403,
                code: 'EFORBIDDEN',
                title: 'Requested resource already exists',
                detail: `The requested resource already exists of type ${request.params.type} with id ${request.params.id}`
            })
        }
        // Push the newResource into our in-memory store.
        this.#resources[request.params.type].push(newResource)
        // Return the newly created resource
        return Promise.resolve(MemoryPromiseHandler.#clone(newResource))
    }

    /**
     * Delete a resource, given a resource type and and id.
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     */
    async delete(request) {
        // Find the requested resource
        const theResource = await this.find(request)

        // Remove the resource from the in-memory store.
        const index = MemoryPromiseHandler.#indexOf(this.#resources[request.params.type], theResource)
        this.#resources[request.params.type].splice(index, 1)

        // Return with no error
        return Promise.resolve()
    }

    /**
     * Find a specific resource, given a resource type and and id.
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     */
    find(request) {
        // Pull the requested resource from the in-memory store
        const theResource = this.#resources[request.params.type].filter(anyResource => anyResource.id === request.params.id).pop()

        // If the resource doesn't exist, error
        if (!theResource) {
            throw new JsonApiError({
                status: 404,
                code: 'ENOTFOUND',
                title: 'Requested resource does not exist',
                detail: `There is no ${request.params.type} with id ${request.params.id}`
            })
        }

        // Return the requested resource
        return Promise.resolve(MemoryPromiseHandler.#clone(theResource))
    }

    /**
     * initialise gets invoked once for each resource that uses this hander.
     * In this instance, we're allocating an array in our in-memory data store.
     *
     * Compat: Joi 17
     *
     * @param {import("../../types/ResourceConfig").ResourceConfig<R>} resourceConfig
     */
    initialise(resourceConfig) {
        const schema = Prop.getAllSchemas(resourceConfig)
        const compiled = Joi.compile(schema)
        const resources = resourceConfig.examples ? resourceConfig.examples.map(item => {
            /**
             * @type {Partial<R>}
             */
            const attrs = { ...item }
            delete attrs.id
            delete attrs.type
            delete attrs.meta
            const validationResult = compiled.validate(attrs)
            if (validationResult.error) {
                return item
            } else {
                return {
                    id: item.id,
                    type: item.type,
                    meta: item.meta,
                    ...validationResult.value
                }
            }
        }) : []
        this.#resources[resourceConfig.resource] = resources
        this.ready = true
    }

    /**
     * Search for a list of resources, given a resource type.
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     * @returns {AsyncGenerator<[R[], number]>}
     */
    async *search(request) {
        const results = this.#filterResources(this.#resources[request.params.type],
            request.params?.filter?.id)

        this.#sortList(request, results)
        const resultCount = results.length
        const resultsPage = this.#paginateResultSet(results, request.params.page)
        yield [[], resultCount]
        const iterationSize = 1_000
        for(let i = 0; i < resultsPage.length; i += iterationSize) {
            yield [MemoryPromiseHandler.#clone(resultsPage.slice(i, i + iterationSize)), 0]
        }
    }

    /**
     * Update a resource, given a resource type and id, along with a partialResource.
     * partialResource contains a subset of changes that need to be merged over the original.
     *
     * @param {import('../../types/JsonApiRequest').JsonApiRequest} request
     * @param {Partial<R>} partialResource
     */
    async update(request, partialResource) {
        // Find the requested resource
        const theResource = await this.find(request)

        // Merge the partialResource over the original
        /**
         * @type {R}
         */
        const modifiedResource = { ...theResource, ...partialResource }

        // Push the newly updated resource back into the in-memory store
        const index = MemoryPromiseHandler.#indexOf(this.#resources[request.params.type], modifiedResource)
        this.#resources[request.params.type][index] = modifiedResource

        // Return the newly updated resource
        return Promise.resolve(MemoryPromiseHandler.#clone(modifiedResource))
    }
}

exports = module.exports = MemoryPromiseHandler
