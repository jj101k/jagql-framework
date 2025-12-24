import { Request, Response } from "express"
import { FilterSpec, FilterSpecByAttrIn } from "./Filter.js"
import { ResourceConfig } from "./ResourceConfig.js"

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
interface JsonApiRouteParams<R> {
    /**
     *
     */
    type: string
}

/**
 *
 */
interface JsonApiIdRouteParams<R> extends JsonApiRouteParams<R> {
    /**
     *
     */
    id: string
}

/**
 *
 */
interface JsonApiRelationshipRouteParams<R> extends JsonApiIdRouteParams<R> {
    /**
     * @deprecated Please use relationship
     */
    relation: string & keyof R
    /**
     *
     */
    relationship: string & keyof R
}

/**
 *
 */
type JsonApiAnyRouteParams<R> = JsonApiIdRouteParams<R> | JsonApiRouteParams<R> | JsonApiRelationshipRouteParams<R>

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

/**
 *
 */
export interface JsonApiRequest<R = any, RP extends JsonApiRouteParams<R> = JsonApiAnyRouteParams<R>> {
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
    inferredBaseUrl: string | null
    /**
     *
     */
    originalUrl: string
    /**
     * @deprecated Please use routeParams (route components: id, type,
     * relationship); or appParams (relationship lookup details); body; or query
     */
    params: JsonApiExtendedQueryParams & JsonApiBodyParams & RP & JsonApiAppParams
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
    routeParams: RP
    /**
     *
     */
    safeHeaders: any
}

/**
 *
 */
export type JsonApiCreateRequest<R> = JsonApiRequest<R, JsonApiRouteParams<R>>
/**
 *
 */
export type JsonApiDeleteRequest<R> = JsonApiRequest<R, JsonApiIdRouteParams<R>>
/**
 *
 */
export type JsonApiFindRequest<R> = JsonApiRequest<R, JsonApiIdRouteParams<R>>
/**
 *
 */
export type JsonApiSearchRequest<R> = JsonApiRequest<R, JsonApiRouteParams<R>>
/**
 *
 */
export type JsonApiUpdateRequest<R> = JsonApiRequest<R, JsonApiIdRouteParams<R>>