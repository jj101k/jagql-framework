/**
 *
 */
module.exports = class RelationStore {
    /**
     * @type {import("./BaseRelation")[]}
     */
    static #relations = []
    /**
     *
     * @param {import("./BaseRelation")} relation
     * @returns
     */
    static addRelation(relation) {
        const i = this.#relations.length
        this.#relations.push(relation)
        return i
    }
    /**
     *
     * @param {number} i
     * @returns
     */
    static getRelation(i) {
        return this.#relations[i]
    }
}