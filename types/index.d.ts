import { ChainCallbackHandler as ChainCallbackHandlerType } from "./ChainCallbackHandler.js"
import { MemoryCallbackHandler as MemoryHandlerType } from "./MemoryCallbackHandler.js"
import { Relationship as RelationshipType } from "../lib/Relationship.js"
import { ChainPromiseHandler } from "./ChainPromiseHandler.js"
import { MemoryPromiseHandler } from "./MemoryPromiseHandler.js"

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