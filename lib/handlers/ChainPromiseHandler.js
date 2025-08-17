'use strict'

const tools = require('../tools')
const { Handler } = require('./Handler')

/**
 * @template R
 */
class ChainPromiseHandler extends Handler {
    jagqlVersion = 1
    /**
     * @type {import("../../types/PromiseHandler").PromiseHandler<R>}
     */
    otherHandler
    /**
     * @template R
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
     * @param {string} action
     * @param  {...any} argsIn
     * @returns
     */
    async #handleAction(action, ...argsIn) {
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        const request = argsIn[0]
        const argsBefore = this[`before${upperAction}`] ?
            await this[`before${upperAction}`](...argsIn) : argsIn
        const resultIn = await this.otherHandler[action](...argsBefore)
        const result = tools.ensureArray(resultIn)

        return this[`after${upperAction}`] ?
            await this[`after${upperAction}`](request, ...result) :
            resultIn
    }

    /**
     *
     * @param {string} action
     * @param  {...any} argsIn
     * @returns
     */
    async #handleActionOptional(action, ...argsIn) {
        if(this.otherHandler[action]) {
            return this.#handleAction(action, ...argsIn)
        }
        const upperAction = action.replace(/^(.)/, (_, $1) => $1.toUpperCase())
        await this[`before${upperAction}`]?.(...argsIn)

        await this[`after${upperAction}`]?.(...argsIn)
    }

    close(...argsIn) {
        return this.#handleActionOptional("close", ...argsIn)
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
        return this.#handleActionOptional("initialise", ...argsIn)
    }

    search(...argsIn) {
        return this.#handleAction("search", ...argsIn)
    }

    update(...argsIn) {
        return this.#handleAction("update", ...argsIn)
    }
}

exports = module.exports = ChainPromiseHandler
