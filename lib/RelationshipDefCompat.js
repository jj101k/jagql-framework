import { RelationshipDef } from "./RelationshipDef.js"
import { RelationshipStore } from "./RelationshipStore.js"

/**
 *
 */
export class RelationshipDefCompat extends RelationshipDef {
    /**
     * @deprecated Please use manyOf()
     *
     * @param  {...string} resources
     * @returns
     */
    many(...resources) {
        const obj = this.manyOf(resources)
        const { settings, schema } = this.ensureSettings(obj)
        /**
         *
         * @param {"uuid" | "autoincrement"} keyType
         * @returns
         */
        schema.uidType = function (keyType) {
            if (keyType !== 'uuid' && keyType !== 'autoincrement') {
                throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
            }
            RelationshipStore.getRelationship(settings.relationshipId).uidType = keyType
            return schema
        }
        return schema
    }

    /**
     * @deprecated Please use oneOf()
     *
     * @param  {...string} resources
     * @returns
     */
    one(...resources) {
        const obj = this.oneOf(resources)
        const { settings, schema } = this.ensureSettings(obj)
        /**
         *
         * @param {"uuid" | "autoincrement"} keyType
         * @returns
         */
        schema.uidType = function (keyType) {
            if (keyType !== 'uuid' && keyType !== 'autoincrement') {
                throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
            }
            RelationshipStore.getRelationship(settings.relationshipId).uidType = keyType
            return schema
        }
        return schema
    }
}