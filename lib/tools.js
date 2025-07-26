module.exports = class tools {
    /**
     *
     * @param {*} v
     * @returns
     */
    static ensureArray(v) {
        if(Array.isArray(v)) {
            return v
        } else {
            return [v]
        }
    }
}