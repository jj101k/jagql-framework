/**
 * @template R
 */
module.exports = class PaginationEnforcer {
    /**
     * @type {number}
     */
    #size

    /**
     *
     */
    get exhausted() {
        return this.#size <= 0
    }
    /**
     * @param {import("../types/JsonApiRequest").JsonApiRequest} request
     */
    constructor(request) {
        this.#size = request.query.page.size
    }
    /**
     *
     * @param {R[]} results
     * @returns
     */
    enforce(results) {
        if(results.length < this.#size) {
            this.#size -= results.length
            return results
        } else {
            const s = this.#size
            this.#size = 0
            return results.slice(0, s)
        }
    }
}