import { BaseRelationship } from "./BaseRelationship.js"

/**
 * This is a relationship which for the application's purposes exists on the local entity.
 */
export class LocalRelationship extends BaseRelationship {
    /**
     *
     * @param {*} rel
     * @returns {rel is LocalRelationship}
     */
    static isLocalRelationship(rel) {
        if(!rel) return false
        if(rel instanceof LocalRelationship) return true
        if("uidType" in rel) {
            console.warn("Property looks like a local relationship, but isn't. Please ensure you aren't using multiple versions of jsonapi-server, as that will not work")
        }
        return false
    }

    /**
     * @readonly
     */
    required
    /**
     *
     */
    uidType

    /**
     *
     * @param {"many" | "one"} count
     * @param {string[]} resourceNames
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} uidType
     */
    constructor(count, resourceNames, required, uidType) {
        super(count, resourceNames)
        this.required = required
        this.uidType = uidType
    }
}