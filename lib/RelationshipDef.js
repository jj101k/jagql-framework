const JoiCompat = require("./JoiCompat")
const Relation = require("./Relation")
const RelationStore = require("./RelationStore")

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
        const relation = Relation.belongsToManyOf(config)
        const { settings, schema } = this.ensureSettings(relation.schema)
        settings.relationId = RelationStore.addRelation(relation)
        return schema
    }

    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToOne(config) {
        const relation = Relation.belongsToOneOf(config)
        const { settings, schema } = this.ensureSettings(relation.schema)
        settings.relationId = RelationStore.addRelation(relation)
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
        const relation = Relation.manyOf(resourceOrResources, required, uidType)
        const { settings, schema } = this.ensureSettings(relation.schema)
        settings.relationId = RelationStore.addRelation(relation)
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
        const relation = Relation.oneOf(resourceOrResources, required, uidType)
        const { settings, schema } = this.ensureSettings(relation.schema)
        settings.relationId = RelationStore.addRelation(relation)
        return schema
    }
}