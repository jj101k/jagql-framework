"use strict"
const Joi = require("joi")
const RelationshipDef = require("./RelationshipDef")
const RelationshipDefCompat = require("./RelationshipDefCompat")

/**
 *
 */
class ourJoi {
    /**
     *
     */
    static relationshipDef = new RelationshipDef()
    /**
     *
     */
    static relationshipDefCompat = new RelationshipDefCompat()
    /**
     *
     */
    static Joi = {
        ...Joi,

        /**
         *
         * @param {import("../types/ourJoi").ModelOptions} config
         * @returns
         */
        belongsToMany: (config) => this.relationshipDef.belongsToMany(config),

        /**
         *
         * @param {import("../types/ourJoi").ModelOptions} config
         * @returns
         */
        belongsToOne: (config) => this.relationshipDef.belongsToOne(config),

        /**
         * @deprecated Please use manyOf()
         *
         * @param  {...string} resources
         * @returns
         */
        many: (...resources) => this.relationshipDefCompat.many(...resources),
        /**
         *
         * @param {string | string[]} resourceOrResources
         * @param {boolean} required
         * @param {"string" | "uuid" | "autoincrement"} [uidType]
         * @returns
         */
        manyOf: (resourceOrResources, required = false, uidType) =>
            this.relationshipDef.manyOf(resourceOrResources, required, uidType),
        /**
         * @deprecated Please use RelationshipDef.oneOf()
         *
         * @param  {...string} resources
         * @returns
         */
        one: (...resources) => this.relationshipDefCompat.one(...resources),
        /**
         *
         * @param {string | string[]} resourceOrResources
         * @param {boolean} required
         * @param {"string" | "uuid" | "autoincrement"} [uidType]
         * @returns
         */
        oneOf: (resourceOrResources, required = false, uidType) =>
            this.relationshipDef.oneOf(resourceOrResources, required, uidType)
    }
}

module.exports = ourJoi