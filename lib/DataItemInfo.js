const Relationship = require('./Relationship')

/**
 *
 */
module.exports = class DataItemInfo {
    /**
     * @readonly
     */
    attributeProperties
    /**
     * @readonly
     */
    linkProperties
    /**
     * @readonly
     */
    relationships
    /**
     *
     * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
     * @returns
     */
    constructor(resourceConfig) {
        this.relationships = Object.fromEntries(Relationship.getAllRelationships(resourceConfig))
        this.linkProperties = Object.keys(this.relationships)
        this.attributeProperties = Object.keys(resourceConfig.attributes).filter(someProperty => {
            if (someProperty === 'id') return false
            if (someProperty === 'type') return false
            if (someProperty === 'meta') return false
            return !Relationship.getRelationship(resourceConfig, someProperty)
        })
    }
}