import { Request, Response } from "express"
import { FilterSpec, FilterSpecByAttrIn } from "./Filter"
import { ResourceConfig } from "./ResourceConfig"

/**
 *
 */
export type HttpVerbs = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'

/**
 *
 */
interface JsonApiQueryParams {
  fields?: any
  filter?: FilterSpecByAttrIn
  include?: string | string[]
  page?: {offset?: number, size: number}
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
  data?: any
}

interface JsonApiAppParams {
  /**
   * Relationship name to ID
   */
  relationships?: Record<string, string>
}

export interface JsonApiRequest {
  appParams: JsonApiAppParams,
  body: JsonApiBodyParams
  /**
   * @deprecated Please use routeParams (route components: id, type,
   * relationship); or appParams (relationship lookup details); body; or query
   */
  params: JsonApiQueryParams & JsonApiBodyParams & JsonApiRouteParams & JsonApiAppParams
  postProcess?: string
  processedFilter?: Record<string, FilterSpec[]>
  query: JsonApiQueryParams
  routeParams: JsonApiRouteParams
  headers: any
  safeHeaders: any
  cookies: any
  originalUrl: string
  express: {
    req: Request
    res: Response
  }
  route: {
    verb: HttpVerbs
    host: string
    base: string
    path: string
    query: string
    combined: string
  }
  resourceConfig?: ResourceConfig | ResourceConfig[]
}
