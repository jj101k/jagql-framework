import { JsonApiRequest } from "./JsonApiRequest"

/**
 *
 */
export class PromiseHandler<R = any> {
    /**
     * Indicates that search() already covers filtering. If not, the results will be
     * filtered afterwards.
     */
    handlesFilter: boolean
    /**
     * Indicates that search() already covers sorting. If not, the results will be
     * sorted afterwards.
     */
    handlesSort: boolean
    /**
     *
     */
    readonly jsonApiServerVersion: 1
    /**
     *
     */
    readonly otherHandler: undefined
    /**
     *
     */
    ready: boolean
    /**
     *
     */
    close?(): any
    /**
     *
     * @param request
     * @param newResource
     */
    create(request: JsonApiRequest, newResource: R): Promise<R>
    /**
     *
     * @param request
     */
    delete(request: JsonApiRequest): Promise<void>
    /**
     *
     * @param request
     */
    find(request: JsonApiRequest): Promise<R>
    /**
     *
     * @param {import("../../types/ResourceConfig").ResourceConfig<R>} resourceConfig
     * @returns
     */
    initialise?: (resourceConfig) => any
    /**
     *
     * @param request
     */
    search(request: JsonApiRequest): Promise<[R[], number]> | AsyncGenerator<[R[], number]>
    /**
     *
     * @param request
     * @param newPartialResource
     */
    update(request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & { id: string }): Promise<R>
}
