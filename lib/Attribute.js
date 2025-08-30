const BaseRelationship = require("./BaseRelationship")

/**
 *
 */
module.exports = class Attribute {
    /**
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string} foreignKey
     * @returns
     */
    static getAttribute(resourceConfig, foreignKey) {
        const schemaOrRelationship = resourceConfig.attributes[foreignKey]
        if(schemaOrRelationship instanceof BaseRelationship) {
            return null
        } else {
            return schemaOrRelationship
        }
    }
}