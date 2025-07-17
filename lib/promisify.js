module.exports.Promisify = class Promisify {
    /**
     *
     * @param {(...args: any[]) => any} f
     * @returns
     */
    static promisify(f) {
        return async (...args) => new Promise((resolve, reject) => {
            f(...args, (err) => err ? reject(err) : resolve())
        })
    }
    /**
     *
     * @param {(...args: any[]) => any} f
     * @returns
     */
    static promisifyFull(f) {
        return async (...args) => new Promise((resolve, reject) => {
            f(...args, (err, ...content) => err ? reject(err) : resolve(content))
        })
    }
}