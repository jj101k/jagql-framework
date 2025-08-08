module.exports = class tools {
    /**
     * Ensures that you have an array of values even if v is a non-array.
     *
     * @template T
     * @param {T | T[]} v
     * @returns {T[]}
     */
    static ensureArray(v) {
        if(Array.isArray(v)) {
            return v
        } else {
            return [v]
        }
    }
    /**
     * Ensures that you have an array of values even if v is a non-array,
     * ensuring that null maps to [].
     *
     * @param {*} v
     * @returns
     */
    static ensureArrayNotNullish(v) {
        return this.ensureArray(v ?? [])
    }
}