/**
 * @template R
 */
export class PaginationEnforcer {
    /**
     * @type {number}
     */
    #limit

    /**
     *
     */
    get exhausted() {
        return this.#limit <= 0
    }
    /**
     * @param {import("../types/JsonApiRequest.js").JsonApiRequest} request
     */
    constructor(request) {
        this.#limit = request.query.page.limit ?? request.query.page.size
    }
    /**
     *
     * @param {R[]} results
     * @returns
     */
    enforce(results) {
        if(results.length < this.#limit) {
            this.#limit -= results.length
            return results
        } else {
            const s = this.#limit
            this.#limit = 0
            return results.slice(0, s)
        }
    }
}