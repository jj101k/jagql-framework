import { Relationship as RelationshipType } from "../lib/Relationship.js"
import * as H from "./CallbackHandler.js"
import { ChainCallbackHandler as ChainCallbackHandlerType } from "./ChainCallbackHandler.js"
import { ChainPromiseHandler } from "./ChainPromiseHandler.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./MemoryPromiseHandler.js"
import * as RC from "./ResourceConfig.js"

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
export * from "./ApiConfig.js"
export * from "./DefineOptions.js"
export * from "./JsonApiProtocols.js"
export * from "./JsonApiRequest.js"
export import ResourceConfig = RC.ResourceConfig
export import CallbackHandler = H.CallbackHandler
/**
 * @deprecated use CallbackHandler
 */
export import Handler = H.CallbackHandler
export import BaseType = RC.BaseType