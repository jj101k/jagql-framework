import { Request, Response } from "express"
import { FilterSpec, FilterSpecByAttrIn } from "./Filter"
import { ResourceConfig } from "./ResourceConfig"

/**
 *
 */
export type HttpVerbs = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'

interface JsonApiRequestParams {
  fields?: any
  filter?: FilterSpecByAttrIn
  include?: string | string[]
  page?: {offset?: number, size: number}
  sort?: any
}
interface JsonApiInternalParams extends JsonApiRequestParams {
  data?: any
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
   * Relationship name to ID
   */
  relationships?: Record<string, string>
  /**
   *
   */
  type?: string
}

export interface JsonApiRequest {
  params: JsonApiInternalParams
  postProcess?: string
  processedFilter?: Record<string, FilterSpec[]>
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
