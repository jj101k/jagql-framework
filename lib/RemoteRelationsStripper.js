const Relation = require("./Relation")
const RemoteRelation = require("./RemoteRelation.js")
const tools = require("./tools.js")

module.exports = class RemoteRelationsStripper {
    #stripKeys
    /**
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     */
    constructor(resourceConfig) {
        /**
         * @type {string[]}
         */
        const stripKeys = []
        for (const [i, rel] of Relation.getAllRelations(resourceConfig)) {
            if (rel instanceof RemoteRelation) {
                stripKeys.push(i)
            }
        }
        this.#stripKeys = stripKeys
    }
    /**
     * This is generally called once per request. It strips all remote-relation
     * keys from the response.
     *
     * @template R
     * @param {R[] | R} itemOrItems
     */
    strip(itemOrItems) {
        const items = tools.ensureArray(itemOrItems)
        if (!this.#stripKeys.length) {
            return
        }
        for (const item of items) {
            for (const i of this.#stripKeys) {
                item[i] = undefined
            }
        }
    }
}