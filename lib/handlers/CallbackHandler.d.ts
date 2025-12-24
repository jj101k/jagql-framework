import { ChainCallbackHandler } from "./ChainCallbackHandler.js"

export type CallbackHandler<R> = ChainCallbackHandler<R> | Omit<ChainCallbackHandler<R>, "chain" | "otherHandler">