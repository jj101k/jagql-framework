import { tools } from "./tools.js"

/**
 *
 */
export class RequestParser {
    /**
     *
     * @param {string} headerName
     * @param {string} basePath The base path as configured
     * @param {string | null} proxyRoot If supplied, this is the path on the
     * local server which the proxy adds.
     */
    static build(headerName, basePath, proxyRoot = null) {
        if (proxyRoot) {
            const canonicalProxyRoot = proxyRoot.replace(/\/*$/, "/")
            if (!basePath.startsWith(canonicalProxyRoot)) {
                throw new Error(`Base path ${basePath} must start with proxy root ${canonicalProxyRoot}`)
            }
            return new RequestParser(headerName, basePath.substring(canonicalProxyRoot.replace(/\/$/, "").length))
        }
        return new RequestParser(headerName, basePath)
    }
    /**
     *
     */
    #basePath
    /**
     *
     */
    #headerName
    /**
     *
     * @param {string} headerName
     * @param {string} basePath The base path relative to any proxy path
     */
    constructor(headerName, basePath) {
        this.#basePath = basePath
        this.#headerName = headerName.toLowerCase()
    }
    /**
     *
     * @param {import("express").Request} req
     * @returns {string | null} The apparent service URL, from the request. This
     * shouldn't be trusted, but may be convenient to pre-fill self-referential
     * URLs in responses.
     */
    inferServiceUrl(req) {
        const header = req.headers[this.#headerName]
        if (!header) return null
        const proxyUrl = tools.ensureArray(header)[0]
        return proxyUrl.replace(/\/*$/, this.#basePath)
    }
}