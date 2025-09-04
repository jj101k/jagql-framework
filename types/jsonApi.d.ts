/**
 * @module @jagql/framework
 */

/// <reference types="express" />

import { Application, Router } from "express"
import RelationshipType from "../lib/Relationship"
import ChainPromiseHandler from "../lib/handlers/ChainPromiseHandler"
import * as H from "./CallbackHandler"
import ChainCallbackHandlerType from "./ChainCallbackHandler"
import { JsonApiRequest } from "./JsonApiRequest"
import MemoryHandlerType from "./MemoryCallbackHandler"
import MemoryPromiseHandler from "./MemoryPromiseHandler"
import * as RC from "./ResourceConfig"
import { ResourceConfig } from "./ResourceConfig"
import { Metrics } from "./metrics"
import { Joi, OurJoiSettings } from "./ourJoi"

export * from "./JsonApiRequest"
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
     * No leading / required
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
     *
     */
    graphiql?: boolean
    /**
     *
     */
    hostname: string
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
     *
     */
    port: number
    /**
     *
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
export const Joi: typeof Joi

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
export function getSchemaSettings(schema: Schema): OurJoiSettings | undefined
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