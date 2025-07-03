/**
 *
 */
module.exports = class urlTools {
    /**
     * @param {import("../types/jsonApi").ApiConfig} config
     * @returns
     */
    static concatenateUrlPrefix(config) {
        const protocol = config.protocol || "http"
        const hostname = config.hostname || "localhost"
        const url = new URL(`${protocol}://${hostname}`)
        url.port = config.port
        url.pathname = config.base
        return url.toString()
    }
}