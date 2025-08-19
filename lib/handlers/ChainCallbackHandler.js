'use strict'

const { Handler } = require('./Handler')
const { Promisify } = require('../promisify')
const tools = require('../tools')

/**
 * @template R
 */
class ChainCallbackHandler extends Handler {
    /**
     * @type {import("../../types/CallbackHandler").CallbackHandler<R>}
     */
    otherHandler
    /**
     * @template R
     * @param {import("../../types/CallbackHandler").CallbackHandler<R>} otherHandler
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
                result
        } catch (err) {
            return callback(err)
        }
        callback(null, ...after)
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

exports = module.exports = ChainCallbackHandler
