/**
 *
 */
module.exports.Promisify = class Promisify {
    /**
     *
     * @param {(...args: any[]) => any} f
     * @returns
     */
    static promisify(f) {
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err) => err ? reject(err) : resolve())
        })
    }
    /**
     *
     * @param {(...args: any[]) => any} f
     * @returns
     */
    static promisifyMulti(f) {
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err, ...content) => err ? reject(err) : resolve(content))
        })
    }
    /**
     *
     * @param {(...args: any[]) => any} f
     * @returns
     */
    static promisifySingle(f) {
        return (...args) => new Promise((resolve, reject) => {
            f(...args, (err, content) => err ? reject(err) : resolve(content))
        })
    }
}