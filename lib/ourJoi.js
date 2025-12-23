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
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     * @returns
     */
    static build(relationshipStore) {
        const relationshipDef = new RelationshipDef(relationshipStore)
        const relationshipDefCompat = new RelationshipDefCompat(relationshipStore)
        return {
            ...Joi,

            /**
             *
             * @param {import("../types/ourJoi.js").ModelOptions} config
             * @returns
             */
            belongsToMany: (config) => relationshipDef.belongsToMany(config),

            /**
             *
             * @param {import("../types/ourJoi.js").ModelOptions} config
             * @returns
             */
            belongsToOne: (config) => relationshipDef.belongsToOne(config),

            /**
             * @deprecated Please use manyOf()
             *
             * @param  {...string} resourceNames
             * @returns
             */
            many: (...resourceNames) => relationshipDefCompat.many(...resourceNames),
            /**
             *
             * @param {string | string[]} resourceOrResources
             * @param {boolean} required
             * @param {"string" | "uuid" | "autoincrement"} [uidType]
             * @returns
             */
            manyOf: (resourceOrResources, required = false, uidType) =>
                relationshipDef.manyOf(resourceOrResources, required, uidType),
            /**
             * @deprecated Please use RelationshipDef.oneOf()
             *
             * @param  {...string} resourceNames
             * @returns
             */
            one: (...resourceNames) => relationshipDefCompat.one(...resourceNames),
            /**
             *
             * @param {string | string[]} resourceOrResources
             * @param {boolean} required
             * @param {"string" | "uuid" | "autoincrement"} [uidType]
             * @returns
             */
            oneOf: (resourceOrResources, required = false, uidType) =>
                relationshipDef.oneOf(resourceOrResources, required, uidType)
        }
    }
}