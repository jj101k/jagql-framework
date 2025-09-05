"use strict"

const tools = require("../tools")
const { Handler } = require("./Handler")

/**
 * @typedef {import("../../types/JsonApiRequest").JsonApiRequest} JsonApiRequest
 */

/**
 * @template R
 */
class ChainPromiseHandler extends Handler {
    jagqlVersion = 1
    /**
     * @type {import("../../types/PromiseHandler").PromiseHandler<R> | undefined}
     */
    otherHandler
    /**
     * @param {import("../../types/PromiseHandler").PromiseHandler<R>} otherHandler
     * @returns
     */
    chain(otherHandler) {
        if (otherHandler.handlesSort) {
            this.handlesSort = true
        }
        if (otherHandler.handlesFilter) {
            this.handlesFilter = true
        }
        if (this.otherHandler instanceof ChainPromiseHandler) {
            this.otherHandler.chain(otherHandler)
        } else {
            this.otherHandler = otherHandler
            this.ready = true
        }
        return this
    }

    /**
     *
     * @template {"create" | "delete" | "find" | "update"} M
     * @param {M} action
     * @param {Parameters<import("../../types/PromiseHandler").PromiseHandler<R>[M]>} argsIn
     * @returns
     */
    async #handleAction(action, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        const request = argsIn[0]
        /**
         * @type {typeof argsIn}
         */
        const argsBefore = this[`before${upperAction}`] ?
            await this[`before${upperAction}`](...argsIn) : argsIn
        const resultIn = await otherHandler[action](...argsBefore)
        const result = tools.ensureArray(resultIn)

        return this[`after${upperAction}`] ?
            this[`after${upperAction}`](request, ...result) :
            resultIn
    }


    /**
     *
     * @template {"search"} M
     * @param {M} action
     * @param {Parameters<import("../../types/PromiseHandler").PromiseHandler<R>[M]>} argsIn
     * @returns
     */
    async *#handleActionGenerator(action, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        const request = argsIn[0]
        /**
         * @type {typeof argsIn}
         */
        const argsBefore = this[`before${upperAction}`] ?
            await this[`before${upperAction}`](...argsIn) : argsIn

        const r = otherHandler[action](...argsBefore)
        if("then" in r) {
            const result = await r

            yield this[`after${upperAction}`] ?
                this[`after${upperAction}`](request, ...result) :
                result
        } else {
            for await (const result of r) {
                yield this[`after${upperAction}`] ?
                    this[`after${upperAction}`](request, ...result) :
                    result
            }
        }
    }

    /**
     *
     * @template {"close" | "initialise"} M
     * @param {M} action
     * @param {Parameters<Exclude<import("../../types/PromiseHandler").PromiseHandler<R>[M], undefined>>} argsIn
     * @returns
     */
    async #handleActionOptional(action, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        if(otherHandler[action]) {
            return this.#handleAction(action, ...argsIn)
        }
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        await this[`before${upperAction}`]?.(...argsIn)

        return this[`after${upperAction}`]?.(...argsIn)
    }

    /**
     *
     * @returns
     */
    close() {
        return this.#handleActionOptional("close")
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {R} newResource
     * @returns
     */
    create(request, newResource) {
        return this.#handleAction("create", request, newResource)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    delete(request) {
        return this.#handleAction("delete", request)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    find(request) {
        return this.#handleAction("find", request)
    }

    /**
     *
     * @param {import("../../types/ResourceConfig").ResourceConfig<R>} resourceConfig
     * @returns
     */
    initialise(resourceConfig) {
        return this.#handleActionOptional("initialise", resourceConfig)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    search(request) {
        return this.#handleActionGenerator("search", request)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {Partial<Exclude<R, "id">> & { id: string }} newPartialResource
     * @returns
     */
    update(request, newPartialResource) {
        return this.#handleAction("update", request, newPartialResource)
    }
}

exports = module.exports = ChainPromiseHandler
