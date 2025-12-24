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
     * @deprecated
     */
    static CallbackHandlers = Object.freeze({
        Chain: ChainCallbackHandler,
        Memory: MemoryCallbackHandler,
    })

    /**
     * @readonly
     * @deprecated
     */
    static ChainHandler = ChainCallbackHandler

    /**
     * @readonly
     * @deprecated
     */
    static getSchemaSettings = JoiCompat.getSettings.bind(JoiCompat)

    /**
     * @readonly
     * @deprecated
     */
    static MemoryHandler = MemoryCallbackHandler

    /**
     * @deprecated
     * @readonly
     */
    static PromiseHandlers = Object.freeze({
        Chain: ChainPromiseHandler,
        Memory: MemoryPromiseHandler
    })

    /**
     * @deprecated
     */
    static Relationship = Relationship

    /**
     * @deprecated
     */
    static get Static() {
        return _getInst()
    }

    /**
     * @deprecated
     */
    static get knownResources() {
        return _getInst().knownResources
    }

    /**
     * @deprecated
     */
    static get Joi() {
        return _getInst().Joi
    }

    /**
     * @deprecated
     */
    static get metrics() {
        return _getInst().metrics
    }

    /**
     * @deprecated
     * @param {(req: import("./JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticate(authFunction) {
        return _getInst().authenticateWithCallback(authFunction)
    }

    /**
     * @deprecated
     * @param {(req: import("./JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithCallback(authFunction) {
        return _getInst().authenticateWithCallback(authFunction)
    }

    /**
     * @deprecated
     * @param {(req: import("./JsonApiRequest.js").JsonApiRequest, cb: () => void) => void} authFunction
     */
    static authenticateWithPromise(authFunction) {
        return _getInst().authenticateWithPromise(authFunction)
    }

    /**
     * @deprecated
     * @returns
     */
    static close() {
        return _getInst().close()
    }

    /**
     * @deprecated
     *
     * @template T
     * @param {import("./ResourceConfig.js").ResourceConfig<T>} resourceConfigIn
     * @param {import("./DefineOptions.js")} [options]
     */
    static define(resourceConfigIn, options) {
        return _getInst().define(resourceConfigIn, options)
    }

    /**
     * @deprecated
     *
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationsFor(resourceConfig) {
        return _getInst().getToManyRelationshipsFor(resourceConfig)
    }

    /**
     * @deprecated
     *
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationshipsFor(resourceConfig) {
        return _getInst().getToManyRelationshipsFor(resourceConfig)
    }

    /**
     * @deprecated
     *
     * @param {() => any} [injectMiddleware]
     */
    static initialise(injectMiddleware) {
        return _getInst().initialise(injectMiddleware)
    }

    /**
     * @deprecated
     *
     * @returns {Promise<boolean>} True if a server was started
     */
    static listen() {
        return _getInst().listen()
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {(request: import("./JsonApiRequest.js").JsonApiRequest,
     * errorState: import("./JsonApiResponse.js").JsonApiError |
     * import("./JsonApiResponse.js").JsonApiError[] | any) => any} errHandler
     */
    static onUncaughtException(errHandler) {
        return _getInst().onUncaughtException(errHandler)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {import("./ApiConfig.js").ApiConfig} apiConfigIn
     */
    static setConfig(apiConfigIn) {
        return _getInst().setConfig(apiConfigIn)
    }

    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {(err?: any) => void} [cb]
     * @returns {Promise<boolean>} True if a server was started
     */
    static start(cb) {
        return _getInst().start(cb)
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
     * @type {Record<string, import("./ResourceConfig.js").ResourceConfig<any>>}
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
     * @returns
     */
    close = () => this.#closeInner()

    /**
     * @readonly
     */
    Joi

    /**
     * @readonly
     */
    relationshipStore = new RelationshipStore()

    /**
     * @deprecated use authenticateWithCallback or authenticateWithPromise
     * @type {Router["authenticateWithCallback"]}
     */
    get authenticateWithCallback() {
        return this.#router.authenticateWithCallback.bind(this.#router)
    }

    /**
     * @type {Router["authenticateWithPromise"]}
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
     * This should be called once per resource, once per service instance.
     *
     * @template T
     * @param {import("./ResourceConfig.js").ResourceConfigIn<T>} resourceConfigIn
     * @param {import("./DefineOptions.js").DefineOptions} [options]
     */
    define(resourceConfigIn, options) {
        const resourceName = resourceConfigIn.resource
        if (!resourceName.match(/^\w*$/)) {
            throw new Error(`Resource "${resourceName}" contains illegal characters!`)
        }
        /**
         * @type {import("./ResourceConfig.js").ResourceConfig}
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
         * @type {import("./ResourceConfig.js").ResourceConfig["onCreate"]}
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
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
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
     * @param {(request: import("./JsonApiRequest.js").JsonApiRequest,
     * errorState: import("./JsonApiResponse.js").JsonApiError |
     * import("./JsonApiResponse.js").JsonApiError[] | any) => any} errHandler
     */
    onUncaughtException(errHandler) {
        this.#errHandler.handler = errHandler.bind(this)
    }

    /**
     *
     * @param {import("./ApiConfig.js").ApiConfig} apiConfigIn
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
