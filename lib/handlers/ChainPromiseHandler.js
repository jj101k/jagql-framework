"use strict"

import { Handler } from "./Handler.js"

/**
 * @typedef {import("../../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 * @typedef {import("../../types/ChainPromiseHandler.js").ChainPromiseHandler} ChainPromiseHandlerT
 */

/**
 * @template R
 * @typedef {import("../../types/PromiseHandler.js").PromiseHandler<R>} PromiseHandler<R>
 */

/**
 * @template R
 *
 * @implements {ChainPromiseHandlerT}
 */
export class ChainPromiseHandler extends Handler {
    /**
     * @type {(() => Promise<void>) | undefined}
     */
    get afterClose() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, result: R) => R) | undefined}
     */
    get afterCreate() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest) => void) | undefined}
     */
    get afterDelete() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, result: R) => R) | undefined}
     */
    get afterFind() {
        return undefined
    }
    /**
     * @type {(() => Promise<void>) | undefined}
     */
    get afterInitialise() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, results: R[], count: number) => [R[],
     * number]) | undefined}
     */
    get afterSearch() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, result: R) => R) | undefined}
     */
    get afterUpdate() {
        return undefined
    }
    /**
     * @type {(() => Promise<void>) | undefined}
     */
    get beforeClose() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, newResource: R) =>
     * Promise<[JsonApiRequest, R]>) | undefined}
     */
    get beforeCreate() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest) => Promise<[JsonApiRequest]>) | undefined}
     */
    get beforeDelete() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest) => Promise<[JsonApiRequest]>) | undefined}
     */
    get beforeFind() {
        return undefined
    }
    /**
     * @type {(() => Promise<void>) | undefined}
     */
    get beforeInitialise() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest) => Promise<[JsonApiRequest]>) | undefined}
     */
    get beforeSearch() {
        return undefined
    }
    /**
     * @type {((request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & { id: string }) => Promise<[JsonApiRequest, Partial<Exclude<R, "id">> & { id: string }]>) | undefined}
     */
    get beforeUpdate() {
        return undefined
    }
    /**
     * @readonly
     * @type {1}
     */
    jsonApiServerVersion = 1
    /**
     * @type {PromiseHandler<R> | undefined}
     */
    otherHandler
    /**
     * @param {PromiseHandler<R>} otherHandler
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
     * @template {"create" | "find" | "update"} M
     * @template {Parameters<Exclude<PromiseHandler<R>[M], undefined>>} P
     * @param {M} action
     * @param {((...p: P) => Promise<P>) | undefined} before
     * @param {((r: P[0], t: Awaited<R>) => R) | undefined} after
     * @param {P} argsIn
     * @returns
     */
    async #handleAction(action, before, after, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        const request = argsIn[0]
        const argsBefore = before ?
            await before(...argsIn) : argsIn
        const result = await otherHandler[action](...argsBefore)

        return after ?
            after(request, result) :
            result
    }


    /**
     *
     * @template {"delete"} M
     * @template {Parameters<Exclude<PromiseHandler<R>[M], undefined>>} P
     * @param {M} action
     * @param {((...p: P) => Promise<P>) | undefined} before
     * @param {((r: P[0]) => void) | undefined} after
     * @param {P} argsIn
     * @returns
     */
    async #handleActionVoid(action, before, after, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        const request = argsIn[0]
        const argsBefore = before ?
            await before(...argsIn) : argsIn
        await otherHandler[action](...argsBefore)

        if(after) {
            after(request)
        }
    }

    /**
     *
     * @template {"close" | "initialise"} M
     * @template {Parameters<Exclude<PromiseHandler<R>[M], undefined>>} P
     * @param {M} action
     * @param {((...p: P) => any) | undefined} before
     * @param {((...p: P) => any) | undefined} after
     * @param {P} argsIn
     * @returns
     */
    async #handleActionOptional(action, before, after, ...argsIn) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        await before?.(...argsIn)

        if(otherHandler[action]) {
            await otherHandler[action](...argsIn)
        }

        after?.(...argsIn)
    }

    /**
     *
     * @returns
     */
    close() {
        return this.#handleActionOptional("close", this.beforeClose?.bind(this), this.afterClose?.bind(this))
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {R} newResource
     * @returns
     */
    create(request, newResource) {
        return this.#handleAction("create", this.beforeCreate?.bind(this), this.afterCreate?.bind(this), request, newResource)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    delete(request) {
        return this.#handleActionVoid("delete", this.beforeDelete?.bind(this),
            this.afterDelete?.bind(this), request)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    find(request) {
        return this.#handleAction("find", this.beforeFind?.bind(this),
            this.afterFind?.bind(this), request)
    }

    /**
     *
     * @param {import("../../types/ResourceConfig.js").ResourceConfig<R>} resourceConfig
     * @returns
     */
    initialise(resourceConfig) {
        return this.#handleActionOptional("initialise", this.beforeInitialise?.bind(this),
            this.afterInitialise?.bind(this), resourceConfig)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @returns
     */
    async *search(request) {
        const otherHandler = this.otherHandler
        if(!otherHandler) {
            throw new Error(`Internal error: chained handler is not present`)
        }
        const [mRequest] = this.beforeSearch ?
            await this.beforeSearch(request) : [request]

        const r = otherHandler.search(mRequest)
        if("then" in r) {
            const result = await r

            yield this.afterSearch ?
                this.afterSearch(request, ...result) :
                result
        } else {
            for await (const result of r) {
                yield this.afterSearch ?
                    this.afterSearch(request, ...result) :
                    result
            }
        }
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {Partial<Exclude<R, "id">> & { id: string }} newPartialResource
     * @returns
     */
    update(request, newPartialResource) {
        return this.#handleAction("update", this.beforeUpdate?.bind(this),
            this.afterUpdate?.bind(this), request, newPartialResource)
    }
}