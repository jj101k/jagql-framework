"use strict"
import Joi from "joi"
import { RelationshipDef } from "./RelationshipDef.js"
import { RelationshipDefCompat } from "./RelationshipDefCompat.js"

/**
 *
 */
export class ourJoi {
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
         * @param {import("../types/ourJoi.js").ModelOptions} config
         * @returns
         */
        belongsToMany: (config) => this.relationshipDef.belongsToMany(config),

        /**
         *
         * @param {import("../types/ourJoi.js").ModelOptions} config
         * @returns
         */
        belongsToOne: (config) => this.relationshipDef.belongsToOne(config),

        /**
         * @deprecated Please use manyOf()
         *
         * @param  {...string} resourceNames
         * @returns
         */
        many: (...resourceNames) => this.relationshipDefCompat.many(...resourceNames),
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
         * @param  {...string} resourceNames
         * @returns
         */
        one: (...resourceNames) => this.relationshipDefCompat.one(...resourceNames),
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