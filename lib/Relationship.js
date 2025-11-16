const tools = require("./tools")
const RemoteRelationship = require("./RemoteRelationship")
const LocalRelationship = require("./LocalRelationship")
const BaseRelationship = require("./BaseRelationship")
const JoiCompat = require("./JoiCompat")
const RelationshipStore = require("./RelationshipStore")

/**
 * @abstract
 */
module.exports = class Relationship {
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     */
    static #validateForeignRelationship(config) {
      if (!config.as) throw new Error("Missing 'as' property when defining a foreign relationship")
      if (!config.resource) throw new Error("Missing 'resource' property when defining a foreign relationship")
    }
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    static belongsToOneOf(config) {
      this.#validateForeignRelationship(config)

      return new RemoteRelationship("one", [ config.resource ], config.as)
    }
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    static belongsToManyOf(config) {
      this.#validateForeignRelationship(config)

      return new RemoteRelationship("many", [ config.resource ], config.as)
    }

    /**
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @returns
     */
    static getAllRelationships(resourceConfig) {
        const settings = Object.fromEntries(JoiCompat.getAllAttributeSettings(resourceConfig))
        /**
         * @type {[string, BaseRelationship][]}
         */
        const out = []
        for(const [k, v] of Object.entries(resourceConfig.attributes)) {
            if(BaseRelationship.isRelationship(v)) {
                out.push([k, v])
            } else if(settings[k]) {
                out.push([k, RelationshipStore.getRelationship(settings[k].relationshipId)])
            }
        }
        return out
    }

    /**
     * @see getAllRelationships()
     *
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string} foreignKey
     * @returns
     */
    static getRelationship(resourceConfig, foreignKey) {
        const schemaOrRelationship = resourceConfig.attributes[foreignKey]
        if(BaseRelationship.isRelationship(schemaOrRelationship)) {
            return schemaOrRelationship
        } else {
            const settings = JoiCompat.getAttributeSettings(resourceConfig, foreignKey)
            return settings ? RelationshipStore.getRelationship(settings.relationshipId) : undefined
        }
    }

    /**
     *
     * @param {string | string[]} resourceOrResources
     * @param {boolean} [required]
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    static manyOf(resourceOrResources, required = false, uidType) {
        return new LocalRelationship("many", tools.ensureArray(resourceOrResources), required, uidType)
    }
    /**
     *
     * @param {string | string[]} resourceOrResources
     * @param {boolean} [required]
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    static oneOf(resourceOrResources, required = false, uidType) {
        return new LocalRelationship("one", tools.ensureArray(resourceOrResources), required, uidType)
    }
}