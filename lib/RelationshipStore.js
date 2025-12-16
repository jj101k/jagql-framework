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
    static #relationships = []
    /**
     *
     * @param {BaseRelationship} relationship
     * @returns
     */
    static addRelationship(relationship) {
        const i = this.#relationships.length
        this.#relationships.push(relationship)
        return i
    }
    /**
     *
     * @param {number} i
     * @returns
     */
    static getRelationship(i) {
        return this.#relationships[i]
    }
}