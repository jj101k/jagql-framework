const { isPromise } = require("./tools")

/**
 *
 */
module.exports.Promisify = class Promisify {
    /**
     *
     * @template {(...args: any) => any} R
     * @param {*} p
     * @param {R} resolve
     * @param {(err?: any) => any} reject
     */
    static #finallySettle(p, resolve, reject) {
        if(isPromise(p)) {
            // Chain into other promise, after it's settled.
            // Note that with resolve and reject being call-once, they will not
            // practically be triggered a second time.
            p.then(resolve, reject)
        }
    }
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
            this.#finallySettle(f(...args, (err) => err ? reject(err) : resolve()), resolve, reject)
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
            this.#finallySettle(f(...args, (err) => err ? reject(err) : resolve()), resolve, reject)
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
            this.#finallySettle(f(...args, (err, ...content) => err ? reject(err) : resolve(content)), resolve, reject)
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
            this.#finallySettle(f(...args, (err, content) => err ? reject(err) : resolve(content)), resolve, reject)
        })
    }
}