import { Request, Response } from "express"
import { FilterSpec, FilterSpecByAttrIn } from "./Filter"
import { ResourceConfig } from "./ResourceConfig"

/**
 *
 */
export type HttpVerbs = "GET" | "POST" | "DELETE" | "PUT" | "PATCH"

/**
 *
 */
interface JsonApiPaginationSettings {
    /**
     * How many items are in a page
     */
    limit: number
    /**
     * How many items to skip
     */
    offset: number
}

/**
 *
 */
interface JsonApiQueryParams {
    /**
     *
     */
    fields?: any
    /**
     *
     */
    filter?: FilterSpecByAttrIn
    /**
     *
     */
    include?: string | string[]
    /**
     *
     */
    page?: Partial<JsonApiPaginationSettings> & {
        /**
         * @deprecated Use limit
         */
        size?: number
    }
    /**
     *
     */
    sort?: any
}

/**
 *
 */
interface JsonApiRouteParams {
    /**
     *
     */
    id?: string
    /**
     * @deprecated Please use relationship
     */
    relation?: string
    /**
     *
     */
    relationship?: string
    /**
     *
     */
    type?: string
}

/**
 *
 */
interface JsonApiBodyParams {
    /**
     *
     */
    data?: any
}

/**
 *
 */
interface JsonApiAppParams {
    /**
     *
     */
    page?: JsonApiPaginationSettings
    /**
     * Relationship name to ID
     */
    relationships?: Record<string, string>
}

/**
 *
 */
type JsonApiExtendedQueryParams = JsonApiQueryParams & Record<string, any>

export interface JsonApiRequest {
    /**
     *
     */
    appParams: JsonApiAppParams
    /**
     *
     */
    body: JsonApiBodyParams
    /**
     *
     */
    cookies: any
    /**
     *
     */
    express: {
        /**
         *
         */
        req: Request
        /**
         *
         */
        res: Response
    }
    /**
     *
     */
    headers: any
    /**
     *
     */
    originalUrl: string
    /**
     * @deprecated Please use routeParams (route components: id, type,
     * relationship); or appParams (relationship lookup details); body; or query
     */
    params: JsonApiExtendedQueryParams & JsonApiBodyParams & JsonApiRouteParams & JsonApiAppParams
    /**
     *
     */
    postProcess?: string
    /**
     *
     */
    processedFilter?: Record<string, FilterSpec[]>
    /**
     *
     */
    query: JsonApiExtendedQueryParams
    /**
     *
     */
    resourceConfig?: ResourceConfig | ResourceConfig[]
    /**
     *
     */
    route: {
        /**
         *
         */
        base: string
        /**
         *
         */
        combined: string
        /**
         *
         */
        host: string
        /**
         *
         */
        path: string
        /**
         *
         */
        query: string
        /**
         *
         */
        verb: HttpVerbs
    }
    /**
     *
     */
    routeParams: JsonApiRouteParams
    /**
     *
     */
    safeHeaders: any
}
