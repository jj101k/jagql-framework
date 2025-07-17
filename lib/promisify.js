module.exports.Promisify = class Promisify {
    static promisify(f) {
        return async (...args) => new Promise((resolve, reject) => {
            f(...args, (err) => err ? reject(err) : resolve())
        })
    }
}