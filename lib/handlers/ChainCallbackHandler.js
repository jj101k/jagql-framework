'use strict'

import { Promisify } from "../promisify.js"
import { tools } from "../tools.js"
import { Handler } from "./Handler.js"

/**
 * @template R
 * @typedef {import("../../types/CallbackHandler.js").CallbackHandler<R>} CallbackHandler<R>
 */

/**
 * @template R
 */
export class ChainCallbackHandler extends Handler {
    /**
     * @type {CallbackHandler<R> | undefined}
     */
    otherHandler
    /**
     * @template R
     * @param {CallbackHandler<R>} otherHandler
     * @returns
     */
    chain(otherHandler) {
        if (otherHandler.handlesSort) {
            this.handlesSort = true
        }
        if (otherHandler.handlesFilter) {
            this.handlesFilter = true
        }
        if (this.otherHandler instanceof ChainCallbackHandler) {
            this.otherHandler.chain(otherHandler)
        } else {
            this.otherHandler = otherHandler
            this.ready = true
        }
        return this
    }

    /**
     *
     * @param {string} action
     * @param  {...any} argsIn
     * @returns
     */
    async #handleAction(action, ...argsIn) {
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        const request = argsIn[0]
        const callback = argsIn.pop()
        // This block catches invocations to synchronous functions (.initialise())
        if (!(callback instanceof Function)) {
            argsIn.push(callback)
            if (this[`before${upperAction}`]) this[`before${upperAction}`](...argsIn)
            if (typeof this.otherHandler[action] === 'function') {
                // sync functions like .initialise() and .close() are optional
                this.otherHandler[action](...argsIn)
            }
            if (this[`after${upperAction}`]) this[`after${upperAction}`](...argsIn)
            return
        }
        let after
        try {
            const argsBefore = this[`before${upperAction}`] ?
                await Promisify.promisifyMulti(this, `before${upperAction}`)(...argsIn) : argsIn
            const resultIn = await Promisify.promisifyMulti(this.otherHandler, action)(...argsBefore)
            const result = tools.ensureArray(resultIn)

            after = this[`after${upperAction}`] ?
                await Promisify.promisifyMulti(this, `after${upperAction}`)(request, ...result) :
                resultIn
        } catch (err) {
            return callback(err)
        }
        callback(null, ...tools.ensureArray(after))
    }

    close(...argsIn) {
        return this.#handleAction("close", ...argsIn)
    }

    create(...argsIn) {
        return this.#handleAction("create", ...argsIn)
    }

    delete(...argsIn) {
        return this.#handleAction("delete", ...argsIn)
    }

    find(...argsIn) {
        return this.#handleAction("find", ...argsIn)
    }

    initialise(...argsIn) {
        return this.#handleAction("initialise", ...argsIn)
    }

    search(...argsIn) {
        return this.#handleAction("search", ...argsIn)
    }

    update(...argsIn) {
        return this.#handleAction("update", ...argsIn)
    }
}