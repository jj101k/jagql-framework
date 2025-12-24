import { BaseRelationship } from "./BaseRelationship.js"

/**
 * @typedef {import("./ourJoi.js").OurJoiSettings} OurJoiSettings
 * @typedef {import("./ResourceConfig.js").ResourceConfig} ResourceConfig
 */

/**
 *
 */
export class JoiCompat {
    /**
     * Caches.
     *
     * @param {ResourceConfig} resourceConfig
     * @returns {[string, OurJoiSettings][]}
     */
    static getAllAttributeSettings(resourceConfig) {
        resourceConfig.attributeSettings ??= {}
        /**
         * @type {[string, OurJoiSettings][]}
         */
        const out = []
        for(const [key, schema] of Object.entries(resourceConfig.attributes)) {
            if(BaseRelationship.isRelationship(schema)) {
                continue
            }
            if (!(key in resourceConfig.attributeSettings)) {
                resourceConfig.attributeSettings[key] = this.getSettings(schema)
            }
            out.push([key, resourceConfig.attributeSettings[key]])
        }
        return out
    }
    /**
     * Caches.
     *
     * @param {ResourceConfig} resourceConfig
     * @param {string} foreignKey
     * @returns
     */
    static getAttributeSettings(resourceConfig, foreignKey) {
        resourceConfig.attributeSettings ??= {}
        if (!(foreignKey in resourceConfig.attributeSettings)) {
            resourceConfig.attributeSettings[foreignKey] = this.getSettings(resourceConfig.attributes[foreignKey])
        }
        return resourceConfig.attributeSettings[foreignKey]
    }
    /**
     * This is often called once per request; or as exported via getSchemaSettings
     * (perhaps for debugging); or many times on startup; or once per
     * filter-value; or once per request-item-attribute; or at other times
     *
     * @param {import("joi").Schema} schema
     * @returns {OurJoiSettings}
     */
    static getSettings(schema) {
        return this.getSettingsFromDescription(schema?.describe())
    }

    /**
     * This is often called once per request; or as exported via getSchemaSettings
     * (perhaps for debugging); or many times on startup; or once per
     * filter-value; or once per request-item-attribute; or at other times
     *
     * @param {import("joi").Description} description
     * @returns {OurJoiSettings}
     */
    static getSettingsFromDescription(description) {
        if (!description) {
            return undefined
        }
        return description.metas?.find(
            m => (typeof m == "object") && m.origin == "json-api-server")
    }
}