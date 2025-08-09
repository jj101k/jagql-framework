const BaseRelation = require("./BaseRelation")

/**
 * This is a relation which for the application's purposes exists on the local entity.
 */
module.exports = class LocalRelation extends BaseRelation {
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