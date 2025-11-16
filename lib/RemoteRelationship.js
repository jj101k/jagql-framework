const BaseRelationship = require("./BaseRelationship")

/**
 * This is a relationship which for the application's purposes exists only on the
 * remote entity(ies).
 */
module.exports = class RemoteRelationship extends BaseRelationship {
    /**
     *
     * @param {*} rel
     * @returns {rel is RemoteRelationship}
     */
    static isRemoteRelationship(rel) {
        if(rel instanceof RemoteRelationship) return true
        if("remoteKey" in rel) {
            console.warn("Property looks like a remote relationship, but isn't. Please ensure you aren't using multiple versions of jsonapi-server, as that will not work")
        }
        return false
    }

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