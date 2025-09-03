"use strict"

const ConfigStore = require("./ConfigStore.js")
const jsonApiResources = require("./jsonApiResources.js")
const jsonApiErrHandler = require("./jsonApiErrHandler.js")
const ourJoi = require("./ourJoi.js")
const router = require("./router.js")
const responseHelper = require("./responseHelper.js")
const handlerEnforcer = require("./handlerEnforcer.js")
const pagination = require("./pagination.js")
const routes = require("./routes")
const metrics = require("./metrics.js")
const schemaValidator = require("./schemaValidator.js")
const version = require(require("path").join(__dirname, "../package.json")).version
const MemoryChallbackHandler = require("./handlers/MemoryCallbackHandler.js")
const ChainCallbackHandler = require("./handlers/ChainCallbackHandler.js")
const urlTools = require("./urlTools.js")
const errorHandlers = require("./errorHandlers/index.js")
const initialRoutes = require("./initialRoutes/index.js")
const JoiCompat = require("./JoiCompat.js")
const Relationship = require("./Relationship.js")
const RemoteRelationship = require("./RemoteRelationship.js")
const Attribute = require("./Attribute.js")
const ChainPromiseHandler = require("./handlers/ChainPromiseHandler.js")
const MemoryPromiseHandler = require("./handlers/MemoryPromiseHandler.js")
const promisifyHandler = require("./promisifyHandler.js")

/**
 *
 */
module.exports = class jsonApi {
    /**
     * @type {Record<string, import("../types/ResourceConfig.js").ResourceConfig<any>>}
     */
    static #resources = jsonApiResources
    /**
     * @type {{config: import("../types/jsonApi").ApiConfig}}
     */
    static #apiConfig = ConfigStore
    /**
     *
     */
    static #errHandler = jsonApiErrHandler

    /**
     *
     * @param {string} base
     * @returns
     */
    static #cleanBaseUrl(base) {
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
    static #closeInner() {
        router.close()
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
    static #startInner() {
        schemaValidator.validateAllResourceConfigs(this.#resources)
        router.applyMiddleware()
        initialRoutes.register()
        routes.register()
        errorHandlers.register()
        if (!this.#apiConfig.config.router) {
            return router.listen(this.#apiConfig.config.port)
        } else {
            return Promise.resolve(false)
        }
    }

    /**
     * @deprecated use "version"
     * @readonly
     */
    static _version = version

    /**
     * @deprecated please use authenticateWithCallback or authenticateWithPromise
     * @type {import("../types/jsonApi.js").authenticate}
     */
    static authenticate = router.authenticateWithCallback.bind(router)

    /**
     * @type {import("../types/jsonApi.js").authenticate}
     */
    static authenticateWithCallback = router.authenticateWithCallback.bind(router)

    /**
     * @type {import("../types/jsonApi.js").authenticateWithPromise}
     */
    static authenticateWithPromise = router.authenticateWithPromise.bind(router)

    /**
     * @readonly
     */
    static CallbackHandlers = Object.freeze({
        Chain: ChainCallbackHandler,
        Memory: MemoryChallbackHandler,
    })

    /**
     * @deprecated use CallbackHandlers.Chain
     */
    static ChainHandler = ChainCallbackHandler

    /**
     *
     * @returns
     */
    static close = () => this.#closeInner()

    /**
     *
     * @returns
     */
    static getExpressServer = () => router.getExpressServer()

    /**
     *
     */
    static Joi = ourJoi.Joi

    /**
     * @deprecated use CallbackHandlers.Memory
     */
    static MemoryHandler = MemoryChallbackHandler

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
    static start = cb => {
        const p = this.#startInner()
        if(!cb) {
            return p
        }
        return p.then((started) => {
            if(started) {
                cb()
            }
            return started
        }, err => {
            cb(err)
            return Promise.reject(err)
        })
    }

    /**
     *
     */
    static Relationship = Relationship

    /**
     * @readonly
     */
    static version = version

    /**
     *
     */
    static get knownResources() {
        return Object.keys(this.#resources)
    }


    /**
     * This should be called once per resource, once per service instance.
     *
     * @type {import("../types/jsonApi").define}
     */
    static define(resourceConfigIn, options) {
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

        handlerEnforcer.wrap(promisifyHandler.for(resourceConfig.handlers))

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
                if(!(rel instanceof RemoteRelationship)) {
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
     */
    static getSchemaSettings = JoiCompat.getSettings.bind(JoiCompat)

    /**
     * @deprecated This is now getToManyRelationshipsFor
     *
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @returns
     */
    static getToManyRelationsFor(resourceConfig) {
        return this.getToManyRelationshipsFor(resourceConfig)
    }

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
     *
     * @param {(request: import("../types/JsonApiRequest").JsonApiRequest,
     * errorState: import("../types/JsonApiResponse").JsonApiError |
     * import("../types/JsonApiResponse").JsonApiError[] | any) => any} errHandler
     */
    static onUncaughtException(errHandler) {
        this.#errHandler.handler = errHandler.bind(this)
    }

    /**
     *
     * @param {import("../types/jsonApi").ApiConfig} apiConfigIn
     */
    static setConfig(apiConfigIn) {
        const apiConfigP = {
            ...apiConfigIn,
            base: this.#cleanBaseUrl(apiConfigIn.base),
            pathPrefix: apiConfigIn.urlPrefixAlias,
        }
        apiConfigP.pathPrefix ??= urlTools.concatenateUrlPrefix(apiConfigP, true)
        this.#apiConfig.config = {...apiConfigP}
        responseHelper.setBaseUrl(apiConfigP.pathPrefix)
        responseHelper.setMetadata(this.#apiConfig.config.meta)
    }
}