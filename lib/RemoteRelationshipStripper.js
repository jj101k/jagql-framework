import { Relationship } from "./Relationship.js"
import { RemoteRelationship } from "./RemoteRelationship.js"
import { tools } from "./tools.js"

/**
 *
 */
export class RemoteRelationshipStripper {
    #stripKeys
    /**
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     */
    constructor(resourceConfig) {
        /**
         * @type {string[]}
         */
        const stripKeys = []
        for (const [i, rel] of Relationship.getAllRelationships(resourceConfig)) {
            if (RemoteRelationship.isRemoteRelationship(rel)) {
                stripKeys.push(i)
            }
        }
        this.#stripKeys = stripKeys
    }
    /**
     * This is generally called once per request. It strips all remote-relationship
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