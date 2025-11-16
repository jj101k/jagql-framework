
/**
 * @template R
 */
module.exports = class DummyFilterHelper {
    /**
     *
     * @param {R[]} r
     * @param {number} t
     * @returns {[R[], number]}
     */
    filter(r, t) {
        return [r, t]
    }
}