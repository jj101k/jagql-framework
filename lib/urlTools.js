/**
 *
 */
module.exports = class urlTools {
    /**
     * @param {import("../types/jsonApi").ApiConfig} config
     * @returns
     */
    static concatenateUrlPrefix(config) {
        const url = new URL(`${config.protocol}://${config.hostname}`)
        url.port = config.port
        url.pathname = config.base
        return url.toString()
    }
}