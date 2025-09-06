import {
    CallbackHandler,
    CreateFunction, DeleteFunction, FindFunction,
    HandlerCallback,
    SearchFunction,
    UpdateFunction
} from "./CallbackHandler"
import { JsonApiRequest } from "./JsonApiRequest"
import { PromiseHandler } from "./PromiseHandler"

type BeforeSearchFunction = SearchFunction
type BeforeFindFunction = FindFunction
type BeforeCreateFunction = CreateFunction
type BeforeDeleteFunction = DeleteFunction
type BeforeUpdateFunction = UpdateFunction

interface AfterSearchFunction<R = any> {
    (request: JsonApiRequest, results: R[], count: number, callback: HandlerCallback<R[], number>): void
}
interface AfterFindFunction<R = any> {
    (request: JsonApiRequest, result: R, callback: HandlerCallback<R>): void
}

interface AfterCreateFunction<R = any> {
    (request: JsonApiRequest, createdResource: R, callback: HandlerCallback<R>): void
}

interface AfterDeleteFunction {
    (request: JsonApiRequest, callback: HandlerCallback<void>): void
}

interface AfterUpdateFunction<R = any> {
    (request: JsonApiRequest, updatedResource: R, callback: HandlerCallback<R>): void
}

/**
 * [[include:chain-handler.md]]
 */
export declare class ChainPromiseHandler<R = any> extends PromiseHandler<R> {
    /**
     *
     */
    readonly otherHandler: PromiseHandler<R> | undefined
    /**
     *
     */
    constructor()
    /**
     * @protected
     */
    afterClose?: () => Promise<void>
    /**
     * @protected
     */
    afterCreate?: (request: JsonApiRequest, result: R) => R
    /**
     * @protected
     */
    afterDelete?: (request: JsonApiRequest) => void
    /**
     * @protected
     */
    afterFind?: (request: JsonApiRequest, result: R) => R
    /**
     * @protected
     */
    afterInitialise?: () => Promise<void>
    /**
     * @protected
     */
    afterSearch?: (request: JsonApiRequest, results: R[], count: number) => [R[], number]
    /**
     * @protected
     */
    afterUpdate?: (request: JsonApiRequest, result: R) => R
    /**
     * @protected
     */
    beforeClose?: () => Promise<void>
    /**
     * @protected
     */
    beforeCreate?: (request: JsonApiRequest, newResource: R) => Promise<[JsonApiRequest, R]>
    /**
     * @protected
     */
    beforeDelete?: (request: JsonApiRequest) => Promise<[JsonApiRequest]>
    /**
     * @protected
     */
    beforeFind?: (request: JsonApiRequest) => Promise<[JsonApiRequest]>
    /**
     * @protected
     */
    beforeInitialise?: () => Promise<void>
    /**
     * @protected
     */
    beforeSearch?: (request: JsonApiRequest) => Promise<[JsonApiRequest]>
    /**
     * @protected
     */
    beforeUpdate?: (request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & { id: string }) => Promise<[JsonApiRequest, Partial<Exclude<R, "id">> & { id: string }]>
    /**
     *
     * @param nextHandler
     */
    chain(nextHandler: PromiseHandler<R>): this
}