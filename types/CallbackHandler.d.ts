import { JsonApiError } from "./JsonApiResponse"
import { JsonApiRequest } from "./JsonApiRequest"
import { ResourceConfig } from './ResourceConfig'

export interface HandlerCallback<R, C = undefined> {
    <R, C>(err?: JsonApiError, result?: R, count?: C): any
    <R>(err?: JsonApiError, result?: R): any
}


export interface SearchFunction<R = any> {
    (request: JsonApiRequest, callback: HandlerCallback<R[], number>): void
}
export interface FindFunction<R = any> {
    (request: JsonApiRequest, callback: HandlerCallback<R>): void
}

export interface CreateFunction<R = any> {
    (request: JsonApiRequest, newResource: R, callback: HandlerCallback<R>): void
}

export interface DeleteFunction {
    (request: JsonApiRequest, callback: HandlerCallback<void>): void
}

export interface UpdateFunction<R = any> {
    (request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & { id: string }, callback: HandlerCallback<R>): void
}

/**
 * [[include:handlers.md]]
 * @param R type of resource (if unspecified, `any`)
 */
declare class CallbackHandler<R = any> {
    constructor(o?: any)
    readonly jagqlVersion?: 0
    /**
     *
     */
    readonly otherHandler: undefined
    initialise(resConfig: ResourceConfig<R>): any
    create: CreateFunction<R>
    search: SearchFunction<R>
    find: FindFunction<R>
    update: UpdateFunction<R>
    delete: DeleteFunction
    close: () => any
    ready: boolean
    /**
     * Indicates that search() already covers sorting. If not, the results will be
     * sorted afterwards.
     */
    handlesSort: boolean
    /**
     * Indicates that search() already covers filtering. If not, the results will be
     * filtered afterwards.
     */
    handlesFilter: boolean
}