/**
 * @typedef {import("./BaseRelationship.js").BaseRelationship} BaseRelationship
 */
/**
 *
 */
export class RelationshipStore {
    /**
     * @type {BaseRelationship[]}
     */
    #relationships = []
    /**
     *
     * @param {BaseRelationship} relationship
     * @returns
     */
    addRelationship(relationship) {
        const i = this.#relationships.length
        this.#relationships.push(relationship)
        return i
    }
    /**
     *
     * @param {number} i
     * @returns
     */
    getRelationship(i) {
        return this.#relationships[i]
    }
}