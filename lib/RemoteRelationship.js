const BaseRelationship = require("./BaseRelationship")

/**
 * This is a relationship which for the application's purposes exists only on the
 * remote entity(ies).
 */
module.exports = class RemoteRelationship extends BaseRelationship {
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