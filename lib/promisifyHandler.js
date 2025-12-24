import { Promisify } from "./promisify.js"

/**
 * @template R
 * @typedef {import("./handlers/PromiseHandler.js").PromiseHandler<R>} PromiseHandler<R>
 */

/**
 * @template R
 */
export class PromisifyHandler {
    /**
     * @template R
     * @param {import("./ResourceConfig.js").ResourceConfig<R>["handlers"] |
     * null} handler
     */
    static for(handler) {
        if(handler?.jsonApiServerVersion === 1) {
            return handler
        } else {
            return new PromisifyHandler(handler)
        }
    }

    /**
     *
     */
    #handler

    /**
     * @type {Partial<PromiseHandler<R>>}
     */
    #promisifiedMethods = {}

    /**
     * @readonly
     */
    jsonApiServerVersion = 1

    /**
     *
     * @param {string} name
     * @returns
     */
    #wrapMultiOnDemand(name) {
        if(!this.#handler[name]) return null
        this.#promisifiedMethods[name] ??= Promisify.promisifyMulti(this.#handler, name)
        return this.#promisifiedMethods[name]
    }

    /**
     *
     * @param {string} name
     * @returns
     */
    #wrapSingleOnDemand(name) {
        if(!this.#handler[name]) return null
        this.#promisifiedMethods[name] ??= Promisify.promisifySingle(this.#handler, name)
        return this.#promisifiedMethods[name]
    }

    /**
     *
     * @param {import("./handlers/CallbackHandler.js").CallbackHandler<R>} handler
     */
    constructor(handler) {
        this.#handler = handler
    }
    /**
     * @type {PromiseHandler<R>["create"]}
     */
    get create() {
        return this.#wrapSingleOnDemand("create")
    }

    /**
     * @type {PromiseHandler<R>["delete"]}
     */
    get delete() {
        return this.#wrapSingleOnDemand("delete")
    }

    /**
     * @type {PromiseHandler<R>["find"]}
     */
    get find() {
        return this.#wrapSingleOnDemand("find")
    }

    /**
     *
     */
    get handlesFilter() {
        return this.#handler.handlesFilter
    }

    /**
     *
     */
    get handlesSort() {
        return this.#handler.handlesSort
    }

    /**
     * @type {PromiseHandler<R>["search"]}
     */
    get search() {
        return this.#wrapMultiOnDemand("search")
    }

    /**
     * @type {PromiseHandler<R>["update"]}
     */
    get update() {
        return this.#wrapSingleOnDemand("update")
    }
}