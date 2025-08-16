/**
 * @module @jagql/framework
 */

/// <reference types="express" />

import { Application, Request, Router } from 'express'
import * as H from './CallbackHandler'
import { Metrics } from './metrics'
import * as RC from './ResourceConfig'
import { ResourceConfig } from './ResourceConfig'
import OurJoi = require('./ourJoi')
import ChainHandlerType = require('./ChainHandler')
import MemoryHandlerType = require('./MemoryHandler')

export import ResourceConfig = RC.ResourceConfig

type JsonApiProtocols = 'http' | 'https'
export import CallbackHandler = H.CallbackHandler
export import BaseType = RC.BaseType

interface ApiConfig {
  graphiql?: boolean
  jsonapi?: boolean
  protocol: JsonApiProtocols
  urlPrefixAlias?: string
  hostname: string
  port: number
  /**
   * No leading / required
   */
  base: string,
  meta: any
  swagger?: any
  router?: Router
  bodyParserJsonOpts?: any
}

/**
 *
 */
interface DefineOptions {
  idRequired: boolean
}

/**
 * Our modified Joi instance
 */
export const Joi: typeof OurJoi.Joi

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
export function define<T>(resConfig: ResourceConfig<T>, options?: DefineOptions): void
export function authenticate(authenticator: (req: Request, cb: () => void) => void): void

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
export function getExpressServer(): Application
export const ChainHandler: typeof ChainHandlerType
export const MemoryHandler: typeof MemoryHandlerType
export function onUncaughtException(err: Error): void
export function start(callback: Function): void
export function close(): void
export function getSchemaSettings(schema: Schema): OurJoi.OurJoiSettings | undefined
