const BaseRelation = require("./BaseRelation")

/**
 * This is a relation which for the application's purposes exists only on the
 * remote entity(ies).
 */
module.exports = class RemoteRelation extends BaseRelation {
    /**
     *
     */
    remoteKey

    /**
     *
     * @param {"many" | "one"} count
     * @param {string[]} resources
     * @param {string} remoteKey Where this entity can be found on the remote one.
     */
    constructor(count, resources, remoteKey) {
        super(count, resources)
        this.remoteKey = remoteKey
    }
}