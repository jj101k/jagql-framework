import { ChainPromiseHandler } from "./ChainPromiseHandler.js"

export type PromiseHandler<R> = ChainPromiseHandler<R> | Omit<ChainPromiseHandler<R>, "chain" | "otherHandler">