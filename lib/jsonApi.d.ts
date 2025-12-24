/**
 * @module @jj101k/jsonapi-server
 */

/// <reference types="express" />

import { Application } from "express"
import { Relationship as RelationshipType } from "../lib/Relationship.js"
import { ChainPromiseHandler } from "../lib/handlers/ChainPromiseHandler.js"
import { ApiConfig } from "./ApiConfig.js"
import { DefineOptions } from "./DefineOptions.js"
import { JsonApiRequest } from "./JsonApiRequest.js"
import * as RC from "./ResourceConfig.js"
import { ResourceConfig } from "./ResourceConfig.js"
import { JsonApiError } from "./errorHandlers/JsonApiError.js"
import { ChainCallbackHandler as ChainCallbackHandlerType } from "./handlers/ChainCallbackHandler.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./handlers/MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./handlers/MemoryPromiseHandler.js"
import { metrics } from "./metrics.js"
import { ourJoi } from "./ourJoi.js"

/**
 *
 */
export class jsonApi {
    /**
     * @deprecated please import CallbackHandlers instead
     */
    static readonly CallbackHandlers: {
        Chain: typeof ChainCallbackHandlerType
        Memory: typeof MemoryHandlerType
    }
    /**
     * @deprecated import CallbackHandlers.Chain instead
     */
    static readonly ChainHandler: typeof ChainCallbackHandlerType
    /**
     * @deprecated please use on instantiated jsonApi
     */
    static Joi: ReturnType<(typeof ourJoi)["build"]>
    /**
     * @deprecated please use on instantiated jsonApi
     */
    static knownResources: string[]
    /**
     * @deprecated import CallbackHandlers.Memory
     */
    static readonly MemoryHandler: typeof MemoryHandlerType
    /**
     * @deprecated please use on instantiated jsonApi
     */
    static metrics: metrics["emitter"]
    /**
     * @deprecated import PromiseHandlers
     */
    static readonly PromiseHandlers: {
        Chain: typeof ChainPromiseHandler
        Memory: typeof MemoryPromiseHandler
    }
    /**
     * @deprecated import Relationship
     */
    static Relationship: typeof RelationshipType
    /**
     * @deprecated Please instantiate instead
     */
    static Static: jsonApi
    /**
     * @deprecated please use authenticateWithCallback or
     * authenticateWithPromise on instantiated jsonApi
     * @param authenticator
     */
    static authenticate(authenticator: (req: JsonApiRequest, cb: () => void) => void): void
    /**
     * @deprecated please use on instantiated jsonApi
     * @param authenticator
     */
    static authenticateWithCallback(authenticator: (req: JsonApiRequest, cb: () => void) => void): void
    /**
     * @deprecated please use on instantiated jsonApi
     * @param authenticator
     */
    static authenticateWithPromise(authenticator: (req: JsonApiRequest) => Promise<void>): void
    /**
     * @deprecated please use on instantiated jsonApi
     */
    static close(): void
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * This should be called once per resource, once per service instance.
     *
     * @param resConfig
     * @param options
     */
    static define<T>(resConfig: RC.ResourceConfigIn<T>, options?: DefineOptions): void
    /**
     * @deprecated Use getToManyRelationshipsFor on instantiated jsonAPi
     *
     * @param resourceConfig
     * @returns
     */
    static getToManyRelationsFor(resourceConfig: ResourceConfig): Iterable<string>
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param resourceConfig
     */
    static getToManyRelationshipsFor(resourceConfig: ResourceConfig): Iterable<string>
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param injectMiddleware
     */
    static initialise(injectMiddleware?: () => any): void
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @returns True if a server was started
     */
    static listen(): Promise<boolean>
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param errHandler
     */
    static onUncaughtException(errHandler: (request: JsonApiRequest, errorState: JsonApiError | JsonApiError[] | any) => any): void
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param {ApiConfig} apiConfig
     */
    static setConfig(apiConfig: ApiConfig): void
    /**
     * @deprecated please use on instantiated jsonApi
     *
     * @param cb
     * @returns True if a server was started
     */
    static start(cb?: (err?: any) => void): Promise<boolean>

    /**
     * Our modified Joi instance
     */
    readonly Joi: ReturnType<(typeof ourJoi)["build"]>
    /**
     *
     */
    knownResources: string[]
    /**
     * @deprecated import CallbackHandlers.Memory
     */
    readonly MemoryHandler: typeof MemoryHandlerType
    /**
     * Application metrics are generated and exposed via an event emitter interface.
     * Whenever a request has been processed and it about to be returned to the customer,
     * a `data` event will be emitted:
     *
     * ```javascript
     * jsonApi.metrics.on("data", function(data) {
     *   // send data to your metrics stack
     * });
     * ```
     */
    metrics: metrics["emitter"]
    /**
     * @deprecated import PromiseHandlers
     */
    readonly PromiseHandlers: {
        Chain: typeof ChainPromiseHandler
        Memory: typeof MemoryPromiseHandler
    }
    /**
     * @deprecated import Relationship
     */
    Relationship: typeof RelationshipType
    /**
     * @deprecated use authenticateWithCallback or authenticateWithPromise
     * @param authenticator
     */
    authenticate(authenticator: (req: JsonApiRequest, cb: () => void) => void): void
    /**
     *
     * @param authenticator
     */
    authenticateWithCallback(authenticator: (req: JsonApiRequest, cb: () => void) => void): void
    /**
     *
     * @param authenticator
     */
    authenticateWithPromise(authenticator: (req: JsonApiRequest) => Promise<void>): void
    /**
     *
     */
    close(): void
    /**
     * @param resConfig
     * @param options
     */
    define<T>(resConfig: RC.ResourceConfigIn<T>, options?: DefineOptions): void
    /**
     * @returns
     */
    getExpressServer(): Application
    /**
     *
     * @param resourceConfig
     * @returns
     */
    getToManyRelationshipsFor(resourceConfig: ResourceConfig): Iterable<string>
    /**
     * This will register all the routes and middleware in use, but if you
     * supply an injection method you can add your middleware between the routes
     * being set up and the final middleware (in particular, the 404 handler)
     * being added.
     *
     * @param injectMiddleware
     */
    initialise(injectMiddleware?: () => any): void
    /**
     * This will (if you did not supply your own router) ask the router to
     * listen.
     *
     * @returns True if a server was started
     */
    listen(): Promise<boolean>
    /**
     *
     * @param errHandler
     */
    onUncaughtException(errHandler: (request: JsonApiRequest, errorState: JsonApiError | JsonApiError[] | any) => any): void
    /**
     * Configure things like -
     *  - http/https
     *  - host, port
     *  - enable/disable swagger
     *
     * @param apiConfig
     */
    setConfig(apiConfig: ApiConfig): void
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
     * @param cb
     * @returns True if a server was started
     */
    start(cb?: (err?: any) => void): Promise<boolean>
}