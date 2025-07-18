/**
 * @module @jagql/framework/lib/handlers/Handler
 */

import {Request, Response} from 'express'
import {ResourceConfig} from './ResourceConfig'

export type HttpVerbs = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'

export type FilterSpec = {operator: "<" | ">" | "~" | ":", value: string} | {operator: null, value: string}

/**
 * Classic form: a string[*]. This includes the ID for relationships.
 * Comma form: Classic form, but comma-separated
 * Array form: An array of classic form values
 * Recursive form: field name (relation) mapped to a filter applicable to
 * that relation[**]
 *
 * * Values may start with "<" (less-than), ">" (greater-than), ":" (contains,
 * case-insensitive) or "~" (equal, case-insensitive), or no prefix (equal).
 * ** Semantically, this will filter _the relation_. It will not filter the
 * top-level item(s). Handlers may of course filter as they please.
 */
export type FilterSpecIn = string | string[] | FilterSpecByAttrIn

/**
 * Each key must be a defined resource attribute; and must not be a
 * "foreign reference".
 *
 * @see FilterSpecIn
 */
export interface FilterSpecByAttrIn {
  [k: string]: FilterSpecIn
}

interface JsonApiRequestParams {
  fields?: any
  filter?: FilterSpecByAttrIn
  include?: any
  page?: any
  sort?: any
}

interface JsonApiInternalParams extends JsonApiRequestParams {
  data?: any
  id?: any
  relation?: any
  relationships?: any
  type?: any
}

export interface JsonApiRequest {
  params: JsonApiInternalParams
  processedFilter?: Record<string, FilterSpec[]>
  headers: any
  safeHeaders: any
  cookies: any
  originalUrl: string
  express: {
    req: Request,
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
  resourceConfig?: ResourceConfig
}

export interface JsonApiError {
  status: string
  code: string
  title: string
  detail: string
}

export interface HandlerCallback<R, C = undefined> {
  <R,C>(err?: JsonApiError, result?: R, count?: C): any
  <R>(err?: JsonApiError, result?: R): any
}


export interface SearchFunction<R=any> {
  (request: JsonApiRequest, callback: HandlerCallback<R[], number>): void
}
export interface FindFunction<R=any> {
  (request: JsonApiRequest, callback: HandlerCallback<R>): void
}

export interface CreateFunction<R=any> {
  (request: JsonApiRequest, newResource: R, callback: HandlerCallback<R>): void
}

export interface DeleteFunction {
  (request: JsonApiRequest, callback: HandlerCallback<void>): void
}

export interface UpdateFunction<R=any> {
  (request: JsonApiRequest, newPartialResource: Partial<Exclude<R, "id">> & {id: string}, callback: HandlerCallback<R>): void
}

/**
 * [[include:handlers.md]]
 * @param R type of resource (if unspecified, `any`)
 */
declare class Handler<R=any> {
  constructor(o?: any)
  initialise(resConfig: ResourceConfig<R>): any
  create: CreateFunction<R>
  search: SearchFunction<R>
  find: FindFunction<R>
  update: UpdateFunction<R>
  delete: DeleteFunction
  close: () => any
  ready: boolean
  handlesSort: boolean
  handlesFilter: boolean
}
