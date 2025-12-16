"use strict"

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Attribute } from "./Attribute.js"
import { ConfigStore } from "./ConfigStore.js"
import { internalError } from "./errorHandlers/internalError.js"
import { notFound } from "./errorHandlers/notFound.js"
import { handlerEnforcer } from "./handlerEnforcer.js"
import { ChainCallbackHandler } from "./handlers/ChainCallbackHandler.js"
import { ChainPromiseHandler } from "./handlers/ChainPromiseHandler.js"
import { MemoryCallbackHandler } from "./handlers/MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./handlers/MemoryPromiseHandler.js"
import { initialRoutes } from "./initialRoutes/index.js"
import { JoiCompat } from "./JoiCompat.js"
import { jsonApiErrHandler } from "./jsonApiErrHandler.js"
import { jsonApiResources } from "./jsonApiResources.js"
import { metrics } from "./metrics.js"
import { ourJoi } from "./ourJoi.js"
import { pagination } from "./pagination.js"
import { PromisifyHandler } from "./promisifyHandler.js"
import { Relationship } from "./Relationship.js"
import { RemoteRelationship } from "./RemoteRelationship.js"
import { responseHelper } from "./responseHelper.js"
import { Router } from "./Router.js"
import { routes } from "./routes/index.js"
import { schemaValidator } from "./schemaValidator.js"
import { urlTools } from "./urlTools.js"

/**
 *
 */
export class jsonApi {
    /**
     * @type {jsonApi | undefined}
     */
    static #cachedInst

    /**
     *
     */
    static get #inst() {
        this.#cachedInst ??= new jsonApi()
        return this.#cachedInst
    }

    /**
     * @deprecated use "version"
     * @readonly
     */
    static get _version() {
        return this.version
    }

    /**
     * @deprecated please use authenticateWithCallback or authenticateWithPromise
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticate = (authFunction) => this.#inst.authenticateWithCallback(authFunction)

    /**
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithCallback = (authFunction) => this.#inst.authenticateWithCallback(authFunction)

    /**
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest) => Promise<void>} authFunction
     */
    static authenticateWithPromise = (authFunction) => this.#inst.authenticateWithPromise(authFunction)

    /**
     * @readonly
     */
    static CallbackHandlers = Object.freeze({
        Chain: ChainCallbackHandler,
        Memory: MemoryCallbackHandler,
    })

    /**
     * @deprecated use CallbackHandlers.Chain
     */
    static ChainHandler = ChainCallbackHandler

    /**
     *
     * @returns
     */
    static close = () => this.#inst.close()

    /**
     *
     * @returns
     */
    static getExpressServer = () => this.#inst.getExpressServer()

    /**
     *
     */
    static Joi = ourJoi.Joi

    /**
     * @deprecated use CallbackHandlers.Memory
     */
    static MemoryHandler = MemoryCallbackHandler

    /**
     *
     */
    static metrics = metrics.emitter

    /**
     * @readonly
     */
    static PromiseHandlers = Object.freeze({
        Chain: ChainPromiseHandler,
        Memory: MemoryPromiseHandler
    })

    /**
     * This will register all the routes and middleware in use, then (if you did
     * not supply your own router) ask the router to listen.
     *
     * If you don't supply a callback, this will return a promise which you can
     * use for error handling, eg. you can either:
     *
     * ```js
     * jsonApi.start(err => {
     *  if(err) {
     *      handleError(err)
     *  }
     * })
     * ```
     *
     * Or:
     * ```js
     * jsonApi.start().catch(err => handleError(err))
     * ```
     *
     * @param {(err?: any) => void} [cb]
     * @returns {Promise<boolean>} True if a server was started
     */
    static start = cb => this.#inst.start(cb)

    /**
     *
     */
    static Relationship = Relationship

    /**
     * @readonly
     */
    static version = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../package.json"), {encoding: "utf-8"})).version

    /**
     *
     */
    static get knownResources() {
        return this.#inst.knownResources
    }


    /**
     * This should be called once per resource, once per service instance.
     *
     * @type {import("../types/jsonApi.js").define}
     */
    static define = (resourceConfigIn, options) => this.#inst.define(resourceConfigIn, options)

    /**
     *
     */
    static getSchemaSettings = JoiCompat.getSettings.bind(JoiCompat)

    /**
     * @deprecated This is now getToManyRelationshipsFor
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationsFor = (resourceConfig) => this.getToManyRelationshipsFor(resourceConfig)

    /**
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static *getToManyRelationshipsFor(resourceConfig) {
        for (const [name, rel] of Relationship.getAllRelationships(resourceConfig)) {
            if (rel.count == "many") {
                yield name
            }
        }
    }

    /**
     * This will register all the routes and middleware in use, but if you
     * supply an injection method you can add your middleware between the routes
     * being set up and the final middleware (in particular, the 404 handler)
     * being added.
     *
     * @param {() => any} [injectMiddleware]
     */
    static initialise = (injectMiddleware) => this.#inst.initialise(injectMiddleware)

    /**
     * This will (if you did not supply your own router) ask the router to
     * listen.
     *
     * @returns {Promise<boolean>} True if a server was started
     */
    static listen = () => this.#inst.listen()

    /**
     *
     * @param {(request: import("../types/JsonApiRequest.js").JsonApiRequest,
     * errorState: import("../types/JsonApiResponse.js").JsonApiError |
     * import("../types/JsonApiResponse.js").JsonApiError[] | any) => any} errHandler
     */
    static onUncaughtException = (errHandler) => this.#inst.onUncaughtException(errHandler)

    /**
     *
     * @param {import("../types/jsonApi.js").ApiConfig} apiConfigIn
     */
    static setConfig = (apiConfigIn) => this.#inst.setConfig(apiConfigIn)

    /**
     * @type {{config: import("../types/jsonApi.js").ApiConfig}}
     */
    #apiConfig = ConfigStore.inst

    /**
     *
     */
    #errHandler = jsonApiErrHandler

    /**
     * @type {Record<string, import("../types/ResourceConfig.js").ResourceConfig<any>>}
     */
    #resources = jsonApiResources

    /**
     *
     */
    #router = new Router(ConfigStore.inst)

    /**
     * Ensures that `base` starts and ends with "/".
     *
     * @param {string} base
     * @returns
     */
    #cleanBaseUrl(base) {
        if (!base) {
            base = ""
        }
        if (base[0] !== "/") {
            base = `/${base}`
        }
        if (base[base.length - 1] !== "/") {
            base += "/"
        }
        return base
    }

    /**
     *
     */
    #closeInner() {
        this.#router.close()
        metrics.emitter.removeAllListeners("data")
        for (const i in this.#resources) {
            const resourceConfig = this.#resources[i]
            if (resourceConfig.handlers.close) resourceConfig.handlers.close()
        }
    }

    /**
     * This will register all the routes and middleware in use, then (if you did
     * not supply your own router) ask the router to listen
     *
     * @returns {Promise<boolean>} True if a server was started
     */
    #startInner() {
        this.initialise()
        return this.listen()
    }

    get version() {
        return jsonApi.version
    }

    /**
     *
     */
    get knownResources() {
        return Object.keys(this.#resources)
    }

    /**
     * @type {import("../types/jsonApi.js").authenticate}
     */
    authenticateWithCallback = this.#router.authenticateWithCallback.bind(this.#router)

    /**
     * @type {import("../types/jsonApi.js").authenticateWithPromise}
     */
    authenticateWithPromise = this.#router.authenticateWithPromise.bind(this.#router)

    /**
     *
     * @returns
     */
    close = () => this.#closeInner()

    /**
     * This should be called once per resource, once per service instance.
     *
     * @type {import("../types/jsonApi.js").define}
     */
    define(resourceConfigIn, options) {
        const resourceName = resourceConfigIn.resource
        if (!resourceName.match(/^\w*$/)) {
            throw new Error(`Resource "${resourceName}" contains illegal characters!`)
        }
        /**
         * @type {import("../types/ResourceConfig.js").ResourceConfig}
         */
        const resourceConfig = this.#resources[resourceName] = {
            actions: {},
            namespace: "default",
            searchParams: {},
            ...resourceConfigIn,
        }

        handlerEnforcer.wrap(PromisifyHandler.for(resourceConfig.handlers))

        resourceConfig.handlers.initialise ??= resourceConfigIn.handlers.initialize
        if (resourceConfig.handlers.initialise) {
            resourceConfig.handlers.initialise(resourceConfig)
        }

        const badAttribute = Object.keys(resourceConfig.attributes).find(
            attribute => !attribute.match(/^\w*$/))
        if(badAttribute) {
            throw new Error(`Attribute "${badAttribute}" on ${resourceConfig.resource} contains illegal characters!`)
        }
        if(resourceConfig.actions) {
            const badAction = Object.keys(resourceConfig.actions).find(
                action => !action.match(/^\w*$/))
            if(badAction) {
                throw new Error(`Attribute "${badAction}" on ${resourceConfig.resource} contains illegal characters!`)
            }
        }

        resourceConfig.searchParams = {
            sort: ourJoi.Joi.any()
                .description("An attribute to sort by")
                .example("title"),
            filter: ourJoi.Joi.any()
                .description("An attribute+value to filter by")
                .example("title"),
            fields: ourJoi.Joi.any()
                .description("An attribute+value to filter by")
                .example("title"),
            include: ourJoi.Joi.any()
                .description("An attribute to include")
                .example("title"),
            ...resourceConfig.searchParams,
            ...pagination.joiPageDefinition,
        }

        const idType = ourJoi.Joi.string()
        const idTypeSpec = (options?.idRequired === false) ? idType.optional() :
            idType.required()

        resourceConfig.attributes = {
            id: idTypeSpec
                .description("Unique resource identifier")
                .example("1234"),
            type: ourJoi.Joi.string().required().valid(resourceConfig.resource)
                .description(`Always "${resourceConfig.resource}"`)
                .example(resourceConfig.resource),
            meta: ourJoi.Joi.object().optional(),
            ...resourceConfig.attributes,
        }

        /**
         * @type {import("../types/ResourceConfig.js").ResourceConfig["onCreate"]}
         */
        const onCreate = resourceConfig.onCreate = {}
        for(const attrName of Object.keys(resourceConfig.attributes)) {
            const rel = Relationship.getRelationship(resourceConfig, attrName)
            if (rel) {
                // Relationships which are defined locally can be set; ones which
                // are defined remotely cannot.
                if(!RemoteRelationship.isRemoteRelationship(rel)) {
                    onCreate[attrName] = rel.schema
                }
                continue
            }
            const schema = Attribute.getAttribute(resourceConfig, attrName)
            if (!schema) {
                throw new Error("Internal error")
            }
            const describe = schema.describe()
            if(!describe.metas?.includes("readonly")) {
                onCreate[attrName] = Attribute.getAttribute(resourceConfig, attrName)
            }
        }

        if(!this.#resources[resourceName].handlers) {
            console.warn(`Handlers missing for ${resourceName} - this should not happen`)
        }
    }

    /**
     *
     * @returns
     */
    getExpressServer = () => this.#router.getExpressServer()

    /**
     * This will register all the routes and middleware in use, but if you
     * supply an injection method you can add your middleware between the routes
     * being set up and the final middleware (in particular, the 404 handler)
     * being added.
     *
     * @param {() => any} [injectMiddleware]
     */
    initialise(injectMiddleware) {
        schemaValidator.validateAllResourceConfigs(this.#resources)
        const configStore = this.#apiConfig
        this.#router.applyMiddleware()
        initialRoutes.register(this.#router, configStore)
        routes.register(this.#router, configStore)
        internalError.register(this.#router)

        if(injectMiddleware) {
            injectMiddleware()
        }
        notFound.register(this.#router)
    }

    /**
     * This will (if you did not supply your own router) ask the router to
     * listen.
     *
     * @returns {Promise<boolean>} True if a server was started
     */
    listen() {
        if (!this.#apiConfig.config.router) {
            return this.#router.listen(this.#apiConfig.config.port)
        } else {
            return Promise.resolve(false)
        }
    }

    /**
     *
     * @param {(request: import("../types/JsonApiRequest.js").JsonApiRequest,
     * errorState: import("../types/JsonApiResponse.js").JsonApiError |
     * import("../types/JsonApiResponse.js").JsonApiError[] | any) => any} errHandler
     */
    onUncaughtException(errHandler) {
        this.#errHandler.handler = errHandler.bind(this)
    }

    /**
     *
     * @param {import("../types/jsonApi.js").ApiConfig} apiConfigIn
     */
    setConfig(apiConfigIn) {
        const apiConfigP = {
            ...apiConfigIn,
            base: this.#cleanBaseUrl(apiConfigIn.base),
            pathPrefix: apiConfigIn.urlPrefixAlias,
        }
        // This is used for both local routing and for advisory links in the
        // response. Despite the name, it's not a path - it's a base URL, and
        // strictly speaking, it's the external one.
        apiConfigP.pathPrefix ??= urlTools.concatenateUrlPrefix(apiConfigP, true)
        this.#apiConfig.config = {...apiConfigP}
        responseHelper.setBaseUrl(apiConfigP.pathPrefix)
        responseHelper.setMetadata(this.#apiConfig.config.meta)
    }

    /**
     * This will register all the routes and middleware in use, then (if you did
     * not supply your own router) ask the router to listen.
     *
     * If you don't supply a callback, this will return a promise which you can
     * use for error handling, eg. you can either:
     *
     * ```js
     * jsonApi.start(err => {
     *  if(err) {
     *      handleError(err)
     *  }
     * })
     * ```
     *
     * Or:
     * ```js
     * jsonApi.start().catch(err => handleError(err))
     * ```
     *
     * @param {(err?: any) => void} [cb]
     * @returns {Promise<boolean>} True if a server was started
     */
    async start(cb) {
        const p = this.#startInner()
        if(!cb) {
            return p
        }
        /**
         * @type {boolean}
         */
        let started
        try {
            started = await p
        } catch(err) {
            cb(err)
            throw err
        }
        if(started) {
            cb()
        }
        return started
    }
}

export { Relationship }
