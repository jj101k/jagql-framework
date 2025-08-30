/**
 *
 */
module.exports = class RelationshipStore {
    /**
     * @type {import("./BaseRelationship")[]}
     */
    static #relationships = []
    /**
     *
     * @param {import("./BaseRelationship")} relationship
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