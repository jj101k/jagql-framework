import { Router } from "express"
import { JsonApiProtocols } from "./JsonApiProtocols.js"

/**
 *
 */

export interface ApiConfig {
    /**
     * No leading / required. This is the base path for the service. Used for
     * internal routing, external route binding; for URL construction where
     * urlPrefixAlias is unset; and included in route advice to handlers.
     *
     * The internal version will always have a leading and trailing "/".
     */
    base: string
    /**
     *
     */
    bodyParserJsonOpts?: any
    /**
     * If true, this will assume that it handles all paths and so apply its
     * error handlers to all paths. Otherwise it will just apply them to paths
     * inside the defined base.
     *
     * Default is true.
     */
    handleAllPaths?: boolean
    /**
     * If set, this is the limit to how many items at most will be in the
     * "include" section in responses.
     */
    includeLimit?: number
    /**
     *
     */
    graphiql?: boolean
    /**
     * Used for URL construction if urlPrefixAlias is unset.
     */
    hostname: string
    /**
     * This can be used if the service runs through a proxy which makes the
     * internal view of the URL unlike the external one.
     */
    inferProxy?: {
        /**
         * A header which contains the URL of the proxy root
         */
        headerName: string
        /**
         * The path which the proxy is expected to add to the beginning of the
         * local URL. This must be the first component of "base" if supplied.
         */
        proxyBasePath?: string
    }
    /**
     *
     */
    jsonapi?: boolean
    /**
     *
     */
    meta: any
    /**
     *
     */
    pathPrefix?: string
    /**
     * Used to launch the service, if you don't provide your own router, as well
     * as for URL construction if urlPrefixAlias is unset.
     */
    port: number
    /**
     * Used to determine which kind of service to start, as well as for URL
     * construction if urlPrefixAlias is unset.
     */
    protocol: JsonApiProtocols
    /**
     * This allows you to override the service program in use. In particular,
     * you may use this to have the server running on a sub-route or run a
     * testing server.
     *
     * If you use this you will have to start the server listening yourself.
     */
    router?: Router
    /**
     *
     */
    swagger?: any
    /**
     *
     */
    tls?: any
    /**
     * If set, this sets the external view of the URL, as may be used if this
     * service runs through a proxy. If not supplied, that's equivalent to
     * supplying `${protocol}://${hostname}:${port}/${base}`. For historical
     * reasons, this value must end with the `base` value.
     */
    urlPrefixAlias?: string
}
