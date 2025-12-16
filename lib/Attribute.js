import { BaseRelationship } from "./BaseRelationship.js"

/**
 *
 */
export class Attribute {
    /**
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {string} foreignKey
     * @returns
     */
    static getAttribute(resourceConfig, foreignKey) {
        const schemaOrRelationship = resourceConfig.attributes[foreignKey]
        if(BaseRelationship.isRelationship(schemaOrRelationship)) {
            return null
        } else {
            return schemaOrRelationship
        }
    }
}