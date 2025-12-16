/**
 * @module @jj101k/jsonapi-server
 */

/// <reference types="express" />

import { Application, Router } from "express"
import RelationshipType from "../lib/Relationship.js"
import ChainPromiseHandler from "../lib/handlers/ChainPromiseHandler.js"
import * as H from "./CallbackHandler.js"
import { ChainCallbackHandler as ChainCallbackHandlerType } from "./ChainCallbackHandler.js"
import { JsonApiRequest } from "./JsonApiRequest.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./MemoryPromiseHandler.js"
import * as RC from "./ResourceConfig.js"
import { ResourceConfig } from "./ResourceConfig.js"
import { Metrics } from "./metrics.js"
import { Joi as OurJoiIn, OurJoiSchema, OurJoiSettings } from "./ourJoi.js"

export * from "./JsonApiRequest.js"
export import ResourceConfig = RC.ResourceConfig
export type JsonApiProtocols = "http" | "https"
export import CallbackHandler = H.CallbackHandler
/**
 * @deprecated use CallbackHandler
 */
export import Handler = H.CallbackHandler
export import BaseType = RC.BaseType

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
    tls?: any,
    /**
     * If set, this sets the external view of the URL, as may be used if this
     * service runs through a proxy. If not supplied, that's equivalent to
     * supplying `${protocol}://${hostname}:${port}/${base}`. For historical
     * reasons, this value must end with the `base` value.
     */
    urlPrefixAlias?: string
}

/**
 *
 */
export interface DefineOptions {
    /**
     *
     */
    idRequired: boolean
}

/**
 * Our modified Joi instance
 */
export const Joi: typeof OurJoiIn

/**
 * Configure things like -
 *  - http/https
 *  - host, port
 *  - enable/disable swagger
 *
 * @param {ApiConfig} apiConfig
 */
export function setConfig(apiConfig: ApiConfig): void

/**
 * [[include:resources.md]]
 * @param {ResourceConfig<T>} resConfig
 * @param {DefineOptions} [options]
 */
export function define<T>(resConfig: RC.ResourceConfigIn<T>, options?: DefineOptions): void

/**
 * @deprecated use authenticateWithCallback or authenticateWithPromise
 * @param authenticator
 */
export function authenticate(authenticator: (req: JsonApiRequest, cb: () => void) => void): void

/**
 *
 * @param authenticator
 */
export function authenticateWithCallback(authenticator: (req: JsonApiRequest, cb: () => void) => void): void

/**
 *
 * @param authenticator
 */
export function authenticateWithPromise(authenticator: (req: JsonApiRequest) => Promise<void>): void

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
export const metrics: Metrics
/**
 *
 */
export function getExpressServer(): Application
/**
 * @deprecated use CallbackHandlers.Chain
 */
export const ChainHandler: typeof ChainCallbackHandlerType
/**
 *
 */
export const CallbackHandlers: {
    Chain: typeof ChainCallbackHandlerType
    Memory: typeof MemoryHandlerType
}
/**
 *
 */
export const PromiseHandlers: {
    Chain: typeof ChainPromiseHandler
    Memory: typeof MemoryPromiseHandler
}
/**
 *
 */
export const Relationship: typeof RelationshipType
/**
 * @deprecated use CallbackHandlers.Memory
 */
export const MemoryHandler: typeof MemoryHandlerType
/**
 * This will register all the routes and middleware in use, but if you
 * supply an injection method you can add your middleware between the routes
 * being set up and the final middleware (in particular, the 404 handler)
 * being added.
 *
 * @param injectMiddleware
 */
export function initialise(injectMiddleware?: () => any): void
/**
 * This will (if you did not supply your own router) ask the router to
 * listen.
 *
 * @returns True if a server was started
 */
export function listen(): Promise<boolean>
/**
 *
 * @param err
 */
export function onUncaughtException(err: Error): void
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
export function start(cb?: (err?: any) => void): Promise<boolean>
/**
 *
 */
export function close(): void
/**
 *
 * @param schema
 */
export function getSchemaSettings(schema: OurJoiSchema): OurJoiSettings | undefined
/**
 * @deprecated See getToManyRelationshipsFor
 *
 * @param ResourceConfig
 * @returns
 */
export function getToManyRelationsFor(ResourceConfig: ResourceConfig): Iterable<string>
/**
 *
 * @param ResourceConfig
 */
export function getToManyRelationshipsFor(ResourceConfig: ResourceConfig): Iterable<string>
/**
 *
 */
export const knownResources: string[]