const { Promisify } = require("./promisify")

/**
 * @typedef {import("../types/PromiseHandler").PromiseHandler} PromiseHandler
 */

/**
 * @template R
 * @implements {import("../types/PromiseHandler").PromiseHandler<R>}
 */
module.exports = class PromisifyHandler {
    /**
     * @template R
     * @param {import("../types/ResourceConfig").ResourceConfig<R>["handlers"] |
     * null} handler
     */
    static for(handler) {
        if(handler?.jagqlVersion === 1) {
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
     * @type {Partial<import("../types/PromiseHandler").PromiseHandler<R>>}
     */
    #promisifiedMethods = {}

    /**
     * @readonly
     */
    jagqlVersion = 1

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
     * @param {import("../types/CallbackHandler").CallbackHandler<R>} handler
     */
    constructor(handler) {
        this.#handler = handler
    }
    /**
     * @type {PromiseHandler["create"]}
     */
    get create() {
        return this.#wrapSingleOnDemand("create")
    }

    /**
     * @type {PromiseHandler["delete"]}
     */
    get delete() {
        return this.#wrapSingleOnDemand("delete")
    }

    /**
     * @type {PromiseHandler["find"]}
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
     * @type {PromiseHandler["search"]}
     */
    get search() {
        return this.#wrapMultiOnDemand("search")
    }

    /**
     * @type {PromiseHandler["update"]}
     */
    get update() {
        return this.#wrapSingleOnDemand("update")
    }
}