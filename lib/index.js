import { ChainCallbackHandler } from "./handlers/ChainCallbackHandler.js"
import { ChainPromiseHandler } from "./handlers/ChainPromiseHandler.js"
import { MemoryCallbackHandler } from "./handlers/MemoryCallbackHandler.js"
import { MemoryPromiseHandler } from "./handlers/MemoryPromiseHandler.js"
import { JoiCompat } from "./JoiCompat.js"
import { jsonApi } from "./jsonApi.js"

export const CallbackHandlers = Object.freeze({
    Chain: ChainCallbackHandler,
    Memory: MemoryCallbackHandler,
})
/**
 *
 */
export const getSchemaSettings = JoiCompat.getSettings.bind(JoiCompat)
export const PromiseHandlers = Object.freeze({
    Chain: ChainPromiseHandler,
    Memory: MemoryPromiseHandler
})

export const Joi = jsonApi.Joi

export { ChainCallbackHandler as ChainHandler } from "./handlers/ChainCallbackHandler.js"
export { MemoryCallbackHandler as MemoryHandler } from "./handlers/MemoryCallbackHandler.js"
export * from "./jsonApi.js"
export * from "./Relationship.js"
export default jsonApi