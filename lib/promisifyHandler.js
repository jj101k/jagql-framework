const { Promisify } = require("./promisify")

/**
 * @template R
 */
module.exports = class PromisifyHandler {
    /**
     *
     */
    #handler

    /**
     * @type {Partial<import("../types/Handler").PromiseHandler<R>>}
     */
    #promisifiedMethods = {}

    /**
     *
     * @param {import("../types/Handler").Handler<R>} handler
     */
    constructor(handler) {
        this.#handler = handler
    }
    /**
     *
     */
    get create() {
        this.#promisifiedMethods.create ??= Promisify.promisifySingle(this.#handler, "create")
        return this.#promisifiedMethods.create
    }

    /**
     *
     */
    get delete() {
        this.#promisifiedMethods.delete ??= Promisify.promisifySingle(this.#handler, "delete")
        return this.#promisifiedMethods.delete
    }

    /**
     *
     */
    get find() {
        this.#promisifiedMethods.find ??= Promisify.promisifySingle(this.#handler, "find")
        return this.#promisifiedMethods.find
    }

    /**
     *
     */
    get search() {
        this.#promisifiedMethods.search ??= Promisify.promisifyMulti(this.#handler, "search")
        return this.#promisifiedMethods.search
    }

    /**
     *
     */
    get update() {
        this.#promisifiedMethods.update ??= Promisify.promisifySingle(this.#handler, "update")
        return this.#promisifiedMethods.update
    }
}