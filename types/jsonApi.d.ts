/**
 * @module @jj101k/jsonapi-server
 */

/// <reference types="express" />

import { Application } from "express"
import { Relationship as RelationshipType } from "../lib/Relationship.js"
import { ChainPromiseHandler } from "../lib/handlers/ChainPromiseHandler.js"
import { ChainCallbackHandler as ChainCallbackHandlerType } from "./ChainCallbackHandler.js"
import { JsonApiRequest } from "./JsonApiRequest.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./MemoryPromiseHandler.js"
import * as RC from "./ResourceConfig.js"
import { ResourceConfig } from "./ResourceConfig.js"
import { Metrics } from "./metrics.js"
import { Joi, OurJoiSchema, OurJoiSettings } from "./ourJoi.js"
import { ApiConfig } from "./ApiConfig.js"
import { DefineOptions } from "./DefineOptions.js"

/**
 *
 */
export class jsonAPI {
    /**
     *
     */
    CallbackHandlers: {
        Chain: typeof ChainCallbackHandlerType
        Memory: typeof MemoryHandlerType
    }
    /**
     * @deprecated use CallbackHandlers.Chain
     */
    ChainHandler: typeof ChainCallbackHandlerType
    /**
     * Our modified Joi instance
     */
    Joi: typeof Joi
    /**
     *
     */
    knownResources: string[]
    /**
     * @deprecated use CallbackHandlers.Memory
     */
    MemoryHandler: typeof MemoryHandlerType
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
    metrics: Metrics
    /**
     *
     */
    PromiseHandlers: {
        Chain: typeof ChainPromiseHandler
        Memory: typeof MemoryPromiseHandler
    }
    /**
     *
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
     * [[include:resources.md]]
     * @param {ResourceConfig<T>} resConfig
     * @param {DefineOptions} [options]
     */
    define<T>(resConfig: RC.ResourceConfigIn<T>, options?: DefineOptions): void
    /**
     *
     */
    getExpressServer(): Application
    /**
     *
     * @param schema
     */
    getSchemaSettings(schema: OurJoiSchema): OurJoiSettings | undefined
    /**
     * @deprecated See getToManyRelationshipsFor
     *
     * @param ResourceConfig
     * @returns
     */
    getToManyRelationsFor(ResourceConfig: ResourceConfig): Iterable<string>
    /**
     *
     * @param ResourceConfig
     */
    getToManyRelationshipsFor(ResourceConfig: ResourceConfig): Iterable<string>
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
     * @param err
     */
    onUncaughtException(err: Error): void
    /**
     * Configure things like -
     *  - http/https
     *  - host, port
     *  - enable/disable swagger
     *
     * @param {ApiConfig} apiConfig
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