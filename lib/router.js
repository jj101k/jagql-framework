"use strict"
const express = require("express")
/**
 * @type {express.Express}
 */
let app
/**
 * @type {import("http").Server | import("https").Server | null}
 */
let server
const cookieParser = require("cookie-parser")
const debug = require("./debugging.js")
const responseHelper = require("./responseHelper.js")
const metrics = require("./metrics.js")
const urlTools = require("./urlTools.js")
const jsonApiResources = require("./jsonApiResources.js")
const ConfigStore = require("./ConfigStore.js")
const { Promisify } = require("./promisify.js")
const { JsonApiError } = require("./errorHandlers/JsonApiError.js")
const RequestParser = require("./RequestParser.js")

/**
 * @typedef {import("../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

module.exports = class router {
    /**
     * @type {(req: JsonApiRequest) => Promise<void>}
     */
    static #authFunction

    /**
     *
     * @param {JsonApiRequest} request
     * @param {express.Response} res
     * @returns
     */
    static async #authenticate(request, res) {
        if (!this.#authFunction) return

        try {
            await this.#authFunction(request)
        } catch (err) {
            console.warn(err)
            const payload = responseHelper.generateError(request, new JsonApiError({
                status: 401,
                code: "UNAUTHORIZED",
                title: "Authentication Failed",
                detail: "You are not authorised to access this resource."
            }))
            res.status(401).end(Buffer.from(JSON.stringify(payload)))
            throw err
        }
    }

    /**
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {JsonApiRequest}
     */
    static #getParams(req, res) {
        const [path, query] = this.stripBasePath(req.url).split("?")

        const headersToRemove = [
            "host", "connection", "accept-encoding", "accept-language", "content-length"
        ]

        const requestX = ConfigStore.config.inferProxy?.headerName ?
            RequestParser.build(ConfigStore.config.inferProxy?.headerName, ConfigStore.config.base,
                ConfigStore.config.inferProxy.proxyBasePath
            ) : null

        const inferredBaseUrl = requestX?.inferServiceUrl(req)

        const combined = this.#getExternalUrl(req, inferredBaseUrl)

        const safeHeaders = { ...req.headers }
        for (const header of headersToRemove) {
            delete safeHeaders[header]
        }

        return {
            appParams: {},
            body: req.body,
            inferredBaseUrl,
            params: { ...req.body, ...req.query,  ...req.params },
            query: req.query,
            routeParams: req.params,
            headers: req.headers,
            safeHeaders,
            cookies: req.cookies,
            originalUrl: req.originalUrl,
            // expose original express req and res objects in case customer handlers need them for any reason.
            // can be useful when custom handlers rely on custom and/or third party express middleware that
            // modifies/augments the express req or res (e.g. res.locals) for things like authentication, authorization,
            // data connection pool management, etc.
            express: { req, res },
            route: {
                verb: req.method,
                host: req.headers.host,
                base: ConfigStore.config.base,
                path: path || "",
                query: query || "",
                combined
            }
        }
    }

    /**
     *
     * @param {import("express").Request} req
     * @param {string | null | undefined} inferredBaseUrl
     * @returns
     */
    static #getExternalUrl(req, inferredBaseUrl) {
        const localUrlPath = req.url
        /**
         * @type {string}
         */
        let urlBase
        /**
         * @type {string}
         */
        let relativePath
        const config = ConfigStore.config
        if(inferredBaseUrl) {
            // Since it's from a header, we don't actually trust it to be a
            // valid URL
            urlBase = inferredBaseUrl.replace(/\/$/, "")
            relativePath = localUrlPath.replace(config.base, "/")
                .replace(/^\/+/, "")
            return `${urlBase}/${relativePath}`
        }
        const urlPrefixAlias = config.urlPrefixAlias
        if (urlPrefixAlias) {
            urlBase = urlPrefixAlias.replace(/\/$/, "")
            relativePath = localUrlPath.replace(config.base, "/")
        } else {
            urlBase = urlTools.concatenateUrlPrefix(config)
            relativePath = localUrlPath
        }
        return new URL(relativePath.replace(/^\/+/, ""), urlBase).toString()
    }

    /**
     *
     * @param {import("express").Request} req
     * @returns
     */
    static #shouldHandleErrors(req) {
        const config = ConfigStore.config
        if(config.handleAllPaths !== false) {
            return true
        }
        if(!req.url.match(/^\w+:/) && !config.base.match(/^\w+:/)) {
            // Neither are full URLs so we can't canonicalise
            const baseShort = config.base.replace(/\/*$/, "")
            return req.url == baseShort || req.url.startsWith(baseShort + "/")
        }
        const url = new URL(req.url, config.base)
        const normalisedBase = new URL(ConfigStore.config.base, req.baseUrl)
        const normalisedBaseShort = normalisedBase.toString().replace(/\/*$/, "")
        return (url.toString() == normalisedBaseShort || url.toString().startsWith(normalisedBaseShort + "/"))
    }

    /**
     * @type {{[verb: string]: {[path: string]: (req: express.Request, res: express.Response, next:
     * (err?: any) => any) => any}}}
     */
    static routes = {}

    /**
     *
     */
    static applyMiddleware() {
        const config = ConfigStore.config
        app = app || config.router || express()
        app.use((req, res, next) => {
            res.set({
                "Content-Type": "application/vnd.api+json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "",
                "Cache-Control": "private, must-revalidate, max-age=0",
                "Expires": "Thu, 01 Jan 1970 00:00:00"
            })

            if (req.method === "OPTIONS") {
                return res.status(204).end()
            }

            return next()
        })

        app.use((req, res, next) => {
            if (!req.headers["content-type"] && !req.headers.accept) return next()

            if (req.headers["content-type"]) {
                // 415 Unsupported Media Type
                if (req.headers["content-type"].match(/^application\/vnd\.api\+json;.+$/)) {
                    return res.status(415).end(`HTTP 415 Unsupported Media Type - [${req.headers["content-type"]}]`)
                }

                // Convert "application/vnd.api+json" content type to "application/json".
                // This enables the express body parser to correctly parse the JSON payload.
                if (req.headers["content-type"].match(/^application\/vnd\.api\+json$/)) {
                    req.headers["content-type"] = "application/json"
                }
            }

            if (req.headers.accept) {
                // 406 Not Acceptable
                const acceptTypes = req.headers.accept.split(/, ?/)
                const matchingTypes = acceptTypes.filter(mediaType => // Accept application/*, */vnd.api+json, */* and the correct JSON:API type.
                    mediaType.match(/^(\*|application)\/(\*|json|vnd\.api\+json)$/) || mediaType.match(/\*\/\*/))

                if (matchingTypes.length === 0) {
                    return res.status(406).end()
                }
            }

            return next()
        })

        app.use(express.json(config.bodyParserJsonOpts))
        app.use(express.urlencoded({ extended: true }))
        app.use(cookieParser())
        if (!config.router) {
            app.disable("x-powered-by")
            app.disable("etag")
        }

        let requestId = 0
        app.route("*").all((req, res, next) => {
            debug.requestCounter(requestId++, req.method, req.url)
            if (requestId > 1000) requestId = 0
            next()
        })
    }

    /**
     *
     * @param {(req: JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithCallback(authFunction) {
        this.#authFunction = Promisify.promisifyFunction(authFunction)
    }

    /**
     *
     * @param {(req: JsonApiRequest) => Promise<void>} authFunction
     */
    static authenticateWithPromise(authFunction) {
        this.#authFunction = authFunction
    }

    /**
     *
     * @param {(request: JsonApiRequest, res: express.Response, errorState:
     * JsonApiError | JsonApiError[] | any, next: (err?: any) => *) => any} handler
     */
    static bindErrorHandler(handler) {
        app.use(
            /**
             * @type {import("express").ErrorRequestHandler}
             */
            (error, req, res, next) => {
                if(this.#shouldHandleErrors(req)) {
                    const request = this.#getParams(req, res)
                    return handler(request, res, error, next)
                } else {
                    next(error)
                }
            })
    }

    /**
     *
     * @param {(request: JsonApiRequest, res: express.Response) => any} handler
     */
    static bindNotFound(handler) {
        app.use((req, res, next) => {
            if(this.#shouldHandleErrors(req)) {
                const request = this.#getParams(req, res)
                return handler(request, res)
            } else {
                next()
            }
        })
    }

    /**
     *
     * @param {{verb: import("../types/JsonApiRequest.js").HttpVerbs, path: string}} config
     * @param {<R>(req: JsonApiRequest, resourceConfig: import("../types/ResourceConfig.js").ResourceConfig<R>, res: import("express").Response) => *} handler
     */
    static bindRoute(config, handler) {
        const path = ConfigStore.config.base + config.path
        /**
         * @type {"get" | "post" | "delete" | "put" | "patch"}
         */
        const verb = config.verb.toLowerCase()

        /**
         *
         * @param {express.Request} req
         * @param {express.Response} res
         * @param {(err?: any) => any} next
         */
        const routeHandler = async (req, res, next) => {
            const request = this.#getParams(req, res)
            const resourceConfig = jsonApiResources[request.routeParams.type]
            request.resourceConfig = resourceConfig
            res.locals.jsonApi = {request, startDate: new Date()}
            await this.#authenticate(request, res)
            try {
                await handler(request, resourceConfig, res)
            } catch (e) {
                return next(e)
            }
            // next() // TODO Not used - this would otherwise trigger 404
        }
        this.routes[verb] ??= {}
        this.routes[verb][config.path] = routeHandler
        app[verb](path, routeHandler)
    }

    /**
     *
     */
    static close() {
        if (server) {
            server.close()
            server = null
        }
    }

    /**
     *
     * @returns
     */
    static getExpressServer() {
        app = app || ConfigStore.config.router || express()
        return app
    }

    /**
     *
     * @param {number} port
     * @returns {Promise<boolean>} true if the server was started
     */
    static listen(port) {
        if(server) {
            return Promise.resolve(false)
        }
        const config = ConfigStore.config
        if (config.protocol === "https") {
            server = require("https").createServer(config.tls || {}, app)
        } else {
            server = require("http").createServer(app)
        }
        return new Promise((resolve, reject) => server?.listen(port, (err) => {
            if(err) {
                return reject(err)
            }
            resolve(true)
        }))
    }

    /**
     *
     * @param {string} path
     * @returns
     */
    static stripBasePath(path) {
        if (path[0] !== "/") path = `/${path}`
        const config = ConfigStore.config
        const i = path.indexOf(config.base)
        if (i == -1) {
            // Compat - this strips to "" if the base is not actually in the path
            console.warn("Request path does not contain JSON:API path")
            return ""
        }
        return path.substring(i + config.base.length)
    }

    /**
     *
     * @param {express.Response} res
     * @param {import("../types/JsonApiResponse").JsonApiResponseBodyWithMeta | import("../types/JsonApiResponse").JsonApiResponseBodyErrorWithMeta} payload
     * @param {number} httpCode
     */
    static sendResponse(res, payload, httpCode) {
        const timeDiff = (new Date()).valueOf() - res.locals.jsonApi?.startDate.valueOf()
        metrics.processResponse(res.locals.jsonApi?.request, httpCode, payload, timeDiff)
        res.status(httpCode).end(Buffer.from(JSON.stringify(payload)))
    }
}

