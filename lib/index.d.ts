import * as H from "./handlers/CallbackHandler.js"
import { ChainCallbackHandler as ChainCallbackHandlerType } from "./handlers/ChainCallbackHandler.js"
import { ChainPromiseHandler } from "./handlers/ChainPromiseHandler.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./handlers/MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./handlers/MemoryPromiseHandler.js"
import { jsonApi } from "./jsonApi.js"
import { Relationship as RelationshipType } from "./Relationship.js"
import * as RC from "./ResourceConfig.js"

/**
 *
 */
export const CallbackHandlers: {
    Chain: typeof ChainCallbackHandlerType
    Memory: typeof MemoryHandlerType
}
/**
 * @deprecated use CallbackHandlers.Chain
 */
export const ChainHandler: typeof ChainCallbackHandlerType
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
export { jsonApi }
export import ResourceConfig = RC.ResourceConfig
export import CallbackHandler = H.CallbackHandler
/**
 * @deprecated use CallbackHandler
 */
export import Handler = H.CallbackHandler
export import BaseType = RC.BaseType
export default jsonApi