"use strict"

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
import { metrics } from "./metrics.js"
import { ourJoi } from "./ourJoi.js"
import { pagination } from "./pagination.js"
import { PromisifyHandler } from "./promisifyHandler.js"
import { Relationship } from "./Relationship.js"
import { RelationshipStore } from "./RelationshipStore.js"
import { RemoteRelationship } from "./RemoteRelationship.js"
import { responseHelper } from "./responseHelper.js"
import { Router } from "./Router.js"
import { routes } from "./routes/index.js"
import { schemaValidator } from "./schemaValidator.js"
import { urlTools } from "./urlTools.js"

/**
 * @type {jsonApi | undefined}
 */
let _cachedInst
/**
 *
 * @returns
 */
const _getInst = () => _cachedInst ??= new jsonApi()

/**
 *
 */
export class jsonApi {
    /**
     * @readonly
     * @deprecated please import CallbackHandlers instead
     */
    static CallbackHandlers = Object.freeze({
        Chain: ChainCallbackHandler,
        Memory: MemoryCallbackHandler,
    })

    /**
     * @readonly
     * @deprecated import CallbackHandlers.Chain instead
     */
    static ChainHandler = ChainCallbackHandler

    /**
     * @deprecated import getSchemaSettings
     */
    static getSchemaSettings = JoiCompat.getSettings.bind(JoiCompat)

    /**
     * @readonly
     * @deprecated import CallbackHandlers.Memory
     */
    static MemoryHandler = MemoryCallbackHandler

    /**
     * @deprecated import PromiseHandlers
     * @readonly
     */
    static PromiseHandlers = Object.freeze({
        Chain: ChainPromiseHandler,
        Memory: MemoryPromiseHandler
    })

    /**
     * @deprecated import Relationship
     */
    static Relationship = Relationship

    /**
     * @deprecated Please instantiate instead
     */
    static get Static() {
        return _getInst()
    }

    /**
     * @deprecated please use on instantiated jsonApi
     */
    static get knownResources() {
        return _getInst().knownResources
    }

    /**
     * @deprecated please use on instantiated jsonApi
     */
    static get Joi() {
        return _getInst().Joi
    }

    /**
     * @deprecated please use on instantiated jsonApi
     */
    static get metrics() {
        return _getInst().metrics
    }

    /**
     * @deprecated please use authenticateWithCallback or
     * authenticateWithPromise on instantiated jsonApi
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticate(authFunction) {
        return _getInst().authenticateWithCallback(authFunction)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithCallback(authFunction) {
        return _getInst().authenticateWithCallback(authFunction)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     * @param {(req: import("../types/JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithPromise(authFunction) {
        return _getInst().authenticateWithPromise(authFunction)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     * @returns
     */
    static close() {
        return _getInst().close()
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
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
    static start(cb) {
        return _getInst().start(cb)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * This should be called once per resource, once per service instance.
     *
     * @type {import("../types/jsonApi.js").define}
     */
    static define(resourceConfigIn, options) {
        return _getInst().define(resourceConfigIn, options)
    }

    /**
     * @deprecated Use getToManyRelationshipsFor on instantiated jsonAPi
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationsFor(resourceConfig) {
        return _getInst().getToManyRelationshipsFor(resourceConfig)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationshipsFor(resourceConfig) {
        return _getInst().getToManyRelationshipsFor(resourceConfig)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * This will register all the routes and middleware in use, but if you
     * supply an injection method you can add your middleware between the routes
     * being set up and the final middleware (in particular, the 404 handler)
     * being added.
     *
     * @param {() => any} [injectMiddleware]
     */
    static initialise(injectMiddleware) {
        return _getInst().initialise(injectMiddleware)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * This will (if you did not supply your own router) ask the router to
     * listen.
     *
     * @returns {Promise<boolean>} True if a server was started
     */
    static listen() {
        return _getInst().listen()
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {(request: import("../types/JsonApiRequest.js").JsonApiRequest,
     * errorState: import("../types/JsonApiResponse.js").JsonApiError |
     * import("../types/JsonApiResponse.js").JsonApiError[] | any) => any} errHandler
     */
    static onUncaughtException(errHandler) {
        return _getInst().onUncaughtException(errHandler)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {import("../types/jsonApi.js").ApiConfig} apiConfigIn
     */
    static setConfig(apiConfigIn) {
        return _getInst().setConfig(apiConfigIn)
    }

    /**
     *
     */
    #apiConfig = new ConfigStore()

    /**
     *
     */
    #errHandler = new jsonApiErrHandler()

    /**
     *
     */
    #metrics

    /**
     * @type {Record<string, import("../types/ResourceConfig.js").ResourceConfig<any>>}
     */
    #resources = {}

    /**
     *
     */
    #responseHelper

    /**
     * @type {Router}
     */
    #router

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
        jsonApi.metrics.removeAllListeners("data")
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

    /**
     * @readonly
     */
    Joi

    /**
     * @readonly
     */
    relationshipStore = new RelationshipStore()

    /**
     * @type {import("../types/jsonApi.js").authenticate}
     */
    get authenticateWithCallback() {
        return this.#router.authenticateWithCallback.bind(this.#router)
    }

    /**
     * @type {import("../types/jsonApi.js").authenticateWithPromise}
     */
    get authenticateWithPromise() {
        return this.#router.authenticateWithPromise.bind(this.#router)
    }

    /**
     *
     */
    get config() {
        return this.#apiConfig.config
    }

    /**
     *
     */
    get knownResources() {
        return Object.keys(this.#resources)
    }

    /**
     *
     */
    get metrics() {
        return this.#metrics.emitter
    }

    /**
     *
     */
    get resources() {
        return this.#resources
    }

    /**
     *
     */
    constructor() {
        this.#metrics = new metrics()
        this.#responseHelper = new responseHelper(this.relationshipStore)
        this.#router = new Router(this.#apiConfig, this.#resources, this.#responseHelper, this.#metrics)
        this.Joi = ourJoi.build(this.relationshipStore)
    }

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
            sort: this.Joi.any()
                .description("An attribute to sort by")
                .example("title"),
            filter: this.Joi.any()
                .description("An attribute+value to filter by")
                .example("title"),
            fields: this.Joi.any()
                .description("An attribute+value to filter by")
                .example("title"),
            include: this.Joi.any()
                .description("An attribute to include")
                .example("title"),
            ...resourceConfig.searchParams,
            ...pagination.joiPageDefinition(this.Joi),
        }

        const idType = this.Joi.string()
        const idTypeSpec = (options?.idRequired === false) ? idType.optional() :
            idType.required()

        resourceConfig.attributes = {
            id: idTypeSpec
                .description("Unique resource identifier")
                .example("1234"),
            type: this.Joi.string().required().valid(resourceConfig.resource)
                .description(`Always "${resourceConfig.resource}"`)
                .example(resourceConfig.resource),
            meta: this.Joi.object().optional(),
            ...resourceConfig.attributes,
        }

        /**
         * @type {import("../types/ResourceConfig.js").ResourceConfig["onCreate"]}
         */
        const onCreate = resourceConfig.onCreate = {}
        for(const attrName of Object.keys(resourceConfig.attributes)) {
            const rel = Relationship.getRelationship(resourceConfig, attrName, this.relationshipStore)
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
    getExpressServer = () => this.#router.getExpressServer();

    /**
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    *getToManyRelationshipsFor(resourceConfig) {
        for (const [name, rel] of Relationship.getAllRelationships(resourceConfig, this.relationshipStore)) {
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
    initialise(injectMiddleware) {
        const relationshipStore = this.relationshipStore
        schemaValidator.validateAllResourceConfigs(this.#resources, relationshipStore)
        const configStore = this.#apiConfig
        this.#router.applyMiddleware()
        initialRoutes.register(this.#router, configStore, this.#responseHelper, relationshipStore, this.Joi)
        routes.register(this.#router, configStore, this.#responseHelper, relationshipStore)
        internalError.register(this.#router, this.#errHandler, this.#responseHelper)

        if(injectMiddleware) {
            injectMiddleware()
        }
        notFound.register(this.#router, this.#responseHelper)
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
        this.#responseHelper.setBaseUrl(apiConfigP.pathPrefix)
        this.#responseHelper.setMetadata(this.#apiConfig.config.meta)
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
