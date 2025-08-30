const BaseRelationship = require("./BaseRelationship")

/**
 * This is a relationship which for the application's purposes exists on the local entity.
 */
module.exports = class LocalRelationship extends BaseRelationship {
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
     * @param {string[]} resources
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} uidType
     */
    constructor(count, resources, required, uidType) {
        super(count, resources)
        this.required = required
        this.uidType = uidType
    }
}