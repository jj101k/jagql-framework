const JoiCompat = require("./JoiCompat")
const Relationship = require("./Relationship")
const RelationshipStore = require("./RelationshipStore")

/**
 *
 */
module.exports = class RelationshipDef {
    /**
     * @protected
     *
     * Adds settings if necessary, and returns them. This is used as part of write
     * functionality, so isn't used often.
     *
     * @param {import('joi').Schema} schema
     * @returns {{settings: import("../types/ourJoi").OurJoiSettings, schema: import('joi').Schema}} This is the only copy which will have the data
     */
    ensureSettings(schema) {
        let settings = JoiCompat.getSettings(schema)
        if (!settings) {
            settings = { origin: "json-api-server" }
            schema = schema.meta(settings)
        }
        return { settings, schema }
    }

    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToMany(config) {
        const relationship = Relationship.belongsToManyOf(config)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = RelationshipStore.addRelationship(relationship)
        return schema
    }

    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToOne(config) {
        const relationship = Relationship.belongsToOneOf(config)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = RelationshipStore.addRelationship(relationship)
        return schema
    }

    /**
     *
     * @param {string | string[]} resourceOrResources
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    manyOf(resourceOrResources, required = false, uidType) {
        const relationship = Relationship.manyOf(resourceOrResources, required, uidType)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = RelationshipStore.addRelationship(relationship)
        return schema
    }

    /**
     *
     * @param {string | string[]} resourceOrResources
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    oneOf(resourceOrResources, required = false, uidType) {
        const relationship = Relationship.oneOf(resourceOrResources, required, uidType)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = RelationshipStore.addRelationship(relationship)
        return schema
    }
}