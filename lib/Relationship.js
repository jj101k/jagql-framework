import { BaseRelationship } from "./BaseRelationship.js"
import { JoiCompat } from "./JoiCompat.js"
import { LocalRelationship } from "./LocalRelationship.js"
import { RelationshipStore } from "./RelationshipStore.js"
import { RemoteRelationship } from "./RemoteRelationship.js"
import { tools } from "./tools.js"

/**
 * @typedef {import("../types/ourJoi.js").ModelOptions} ModelOptions
 * @typedef {import("../types/ResourceConfig.js").ResourceConfig} ResourceConfig
 */

/**
 * @abstract
 */
export class Relationship {
    /**
     *
     * @param {ModelOptions} config
     */
    static #validateForeignRelationship(config) {
      if (!config.as) throw new Error("Missing 'as' property when defining a foreign relationship")
      if (!config.resource) throw new Error("Missing 'resource' property when defining a foreign relationship")
    }
    /**
     *
     * @param {ModelOptions} config
     * @returns
     */
    static belongsToOneOf(config) {
      this.#validateForeignRelationship(config)

      return new RemoteRelationship("one", [ config.resource ], config.as)
    }
    /**
     *
     * @param {ModelOptions} config
     * @returns
     */
    static belongsToManyOf(config) {
      this.#validateForeignRelationship(config)

      return new RemoteRelationship("many", [ config.resource ], config.as)
    }

    /**
     *
     * @param {ResourceConfig} resourceConfig
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
     * @param {ResourceConfig} resourceConfig
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