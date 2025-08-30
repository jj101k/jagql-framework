const BaseRelationship = require("./BaseRelationship")

/**
 *
 */
module.exports = class Prop {
    /**
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @returns
     */
    static getAllSchemas(resourceConfig) {
        /**
         * @type {[string, import("joi").Schema][]}
         */
        const out = []
        for(const [k, v] of Object.entries(resourceConfig.attributes)) {
            if(v instanceof BaseRelationship) {
                out.push([k, v.schema])
            } else {
                out.push([k, v])
            }
        }
        return Object.fromEntries(out)
    }

    /**
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string} k
     * @returns
     */
    static hasProperty(resourceConfig, k) {
        return !!resourceConfig.attributes[k]
    }
}