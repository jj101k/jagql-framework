const Relation = require('./Relation')

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
    relations
    /**
     *
     * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
     * @returns
     */
    constructor(resourceConfig) {
        this.relations = Object.fromEntries(Relation.getAllRelations(resourceConfig))
        this.linkProperties = Object.keys(this.relations)
        this.attributeProperties = Object.keys(resourceConfig.attributes).filter(someProperty => {
            if (someProperty === 'id') return false
            if (someProperty === 'type') return false
            if (someProperty === 'meta') return false
            return !Relation.getRelation(resourceConfig, someProperty)
        })
    }
}