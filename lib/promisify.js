/**
 *
 */
module.exports.Promisify = class Promisify {
    /**
     *
     * @template {[m: M]()} O
     * @template {string} M
     * @param {O} o
     * @param {M} m
     * @returns
     */
    static promisify(o, m) {
        const f = o[m].bind(o)
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err) => err ? reject(err) : resolve())
        })
    }
    /**
     *
     * @template R
     * @template {() => R} F
     * @param {F} f
     * @returns {(...args) => Promise<R>}
     */
    static promisifyFunction(f) {
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err) => err ? reject(err) : resolve())
        })
    }
    /**
     *
     * @template {[m: M]()} O
     * @template {string} M
     * @param {O} o
     * @param {M} m
     * @returns
     */
    static promisifyMulti(o, m) {
        const f = o[m].bind(o)
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err, ...content) => err ? reject(err) : resolve(content))
        })
    }
    /**
     *
     * @template {[m: M]()} O
     * @template {string} M
     * @param {O} o
     * @param {M} m
     * @returns
     */
    static promisifySingle(o, m) {
        const f = o[m].bind(o)
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err, content) => err ? reject(err) : resolve(content))
        })
    }
}