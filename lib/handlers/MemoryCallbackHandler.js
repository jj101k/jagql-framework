'use strict'
import { MemoryPromiseHandler } from "./MemoryPromiseHandler.js"

/**
 * @template R
 * @typedef {import("../JsonApiRequest.js").JsonApiRequest<R>} JsonApiRequest<R>
 */

/**
 * @template {{id: string}} R
 */
export class MemoryCallbackHandler {
    /**
     * @type {MemoryPromiseHandler<R>}
     */
    #promiseHandler

    /**
     *
     */
    get ready() {
        return this.#promiseHandler.ready
    }
    set ready(v) {
        this.#promiseHandler.ready = v
    }

    /**
     *
     */
    constructor() {
        this.#promiseHandler = new MemoryPromiseHandler()
    }

    /**
     * Create (store) a new resource given a resource type and an object.
     *
     * @param {JsonApiRequest<R>} request
     * @param {R} newResource
     * @param {(err: *, r?: R) => any} callback
     */
    async create(request, newResource, callback) {
        /**
         * @type {R}
         */
        let r
        try {
            r = await this.#promiseHandler.create(request, newResource)
        } catch(e) {
            callback(e)
            return
        }
        callback(null, r)
    }

    /**
     * Delete a resource, given a resource type and and id.
     *
     * @param {JsonApiRequest<R>} request
     * @param {(err?: *) => any} callback
     */
    async delete(request, callback) {
        try {
            await this.#promiseHandler.delete(request)
        } catch(e) {
            callback(e)
            return
        }
        callback()
    }

    /**
     * Find a specific resource, given a resource type and and id.
     *
     * @param {JsonApiRequest<R>} request
     * @param {(err: *, r?: R) => any} callback
     */
    async find(request, callback) {
        /**
         * @type {R}
         */
        let r
        try {
            r = await this.#promiseHandler.find(request)
        } catch(e) {
            callback(e)
            return
        }
        callback(null, r)
    }

    /**
     * initialise gets invoked once for each resource that uses this hander.
     * In this instance, we're allocating an array in our in-memory data store.
     *
     * Compat: Joi 17
     *
     * @param {import("../ResourceConfig.js").ResourceConfig<R>} resourceConfig
     */
    initialise(resourceConfig) {
        this.#promiseHandler.initialise(resourceConfig)
    }

    /**
     * Search for a list of resources, given a resource type.
     *
     * @param {JsonApiRequest<R>} request
     * @param {(err: *, rs?: R[], rc?: number) => *} callback
     */
    async search(request, callback) {
        /**
         * @type {R[]}
         */
        let rs = []
        /**
         * @type {number}
         */
        let rc = 0
        try {
            for await (const [rsi, rci] of this.#promiseHandler.search(request)) {
                rs.push(...rsi)
                rc += rci
            }
        } catch (e) {
            callback(e)
            return
        }
        callback(null, rs, rc)
    }

    /**
     * Update a resource, given a resource type and id, along with a partialResource.
     * partialResource contains a subset of changes that need to be merged over the original.
     *
     * @param {JsonApiRequest<R>} request
     * @param {Partial<R>} partialResource
     * @param {(err: *, r?: R) => any} callback
     */
    async update(request, partialResource, callback) {
        /**
         * @type {R}
         */
        let r
        try {
            r = await this.#promiseHandler.update(request, partialResource)
        } catch(e) {
            callback(e)
            return
        }
        callback(null, r)
    }
}