import { JsonApiRequest } from "./JsonApiRequest"

/**
 *
 */
export class PromiseHandler<R = any> {
    readonly jagqlVersion: 1
    create(request: JsonApiRequest, newResource: R): Promise<R>
    delete(request: JsonApiRequest): Promise<void>
    find(request: JsonApiRequest): Promise<R>
    search(request: JsonApiRequest): Promise<[R[], number]> | AsyncGenerator<[R[], number]>
    update(request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & { id: string }): Promise<R>
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
