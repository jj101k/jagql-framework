import { RelationshipDef } from "./RelationshipDef.js"

/**
 *
 */
export class RelationshipDefCompat extends RelationshipDef {
    /**
     * @deprecated Please use manyOf()
     *
     * @param  {...string} resourceNames
     * @returns
     */
    many(...resourceNames) {
        const obj = this.manyOf(resourceNames)
        const { settings, schema } = this.ensureSettings(obj)
        /**
         *
         * @param {"uuid" | "autoincrement"} keyType
         * @returns
         */
        schema.uidType = (keyType) => {
            if (keyType !== 'uuid' && keyType !== 'autoincrement') {
                throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
            }
            this.relationshipStore.getRelationship(settings.relationshipId).uidType = keyType
            return schema
        }
        return schema
    }

    /**
     * @deprecated Please use oneOf()
     *
     * @param  {...string} resourceNames
     * @returns
     */
    one(...resourceNames) {
        const obj = this.oneOf(resourceNames)
        const { settings, schema } = this.ensureSettings(obj)
        /**
         *
         * @param {"uuid" | "autoincrement"} keyType
         * @returns
         */
        schema.uidType = (keyType) => {
            if (keyType !== 'uuid' && keyType !== 'autoincrement') {
                throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
            }
            this.relationshipStore.getRelationship(settings.relationshipId).uidType = keyType
            return schema
        }
        return schema
    }
}