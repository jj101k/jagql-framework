import { JoiCompat } from "./JoiCompat.js"
import { Relationship } from "./Relationship.js"

/**
 * @typedef {import("./ModelOptions.js").ModelOptions} ModelOptions
 */

/**
 *
 */
export class RelationshipDef {
    /**
     * @protected
     * @readonly
     */
    relationshipStore

    /**
     *
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    constructor(relationshipStore) {
        this.relationshipStore = relationshipStore
    }

    /**
     * @protected
     *
     * Adds settings if necessary, and returns them. This is used as part of write
     * functionality, so isn't used often.
     *
     * @param {import("joi").Schema} schema
     * @returns {{settings: import("./ourJoi.js").OurJoiSettings, schema: import("joi").Schema}} This is the only copy which will have the data
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
     * @param {ModelOptions} config
     * @returns
     */
    belongsToMany(config) {
        const relationship = Relationship.belongsToManyOf(config)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = this.relationshipStore.addRelationship(relationship)
        return schema
    }

    /**
     *
     * @param {ModelOptions} config
     * @returns
     */
    belongsToOne(config) {
        const relationship = Relationship.belongsToOneOf(config)
        const { settings, schema } = this.ensureSettings(relationship.schema)
        settings.relationshipId = this.relationshipStore.addRelationship(relationship)
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
        settings.relationshipId = this.relationshipStore.addRelationship(relationship)
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
        settings.relationshipId = this.relationshipStore.addRelationship(relationship)
        return schema
    }
}