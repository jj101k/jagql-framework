import { BaseRelationship } from "./BaseRelationship.js"

/**
 * @typedef {import("../types/ResourceConfig.js").ResourceConfig} ResourceConfig
 */

/**
 *
 */
export class Prop {
    /**
     *
     * @param {ResourceConfig} resourceConfig
     * @returns
     */
    static getAllSchemas(resourceConfig) {
        /**
         * @type {[string, import("joi").Schema][]}
         */
        const out = []
        for(const [k, v] of Object.entries(resourceConfig.attributes)) {
            if(BaseRelationship.isRelationship(v)) {
                out.push([k, v.schema])
            } else {
                out.push([k, v])
            }
        }
        return Object.fromEntries(out)
    }

    /**
     *
     * @param {ResourceConfig} resourceConfig
     * @param {string} k
     * @returns
     */
    static hasProperty(resourceConfig, k) {
        return !!resourceConfig.attributes[k]
    }
}