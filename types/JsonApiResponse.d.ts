/**
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface JsonApiResponseBodyBase {
    jsonapi?: {
        version: "1.0"
    },
    links?: Record<string, string>
}

interface JsonApiResourceIdentifierObject {
    id: string
    type: string
    meta?: any
}

interface JsonApiRelationshipObject {
    links?: any
    data?: JsonApiResourceIdentifierObject[] | JsonApiResourceIdentifierObject | null
    meta?: any
}

/**
 *
 */
export interface JsonApiLink {
    meta: {
        relation: "primary",
        readOnly: boolean
    } | {
        as: string
        belongsTo: string
        many: boolean
        relation: "foreign",
        readOnly: boolean
    },
    links: {
        self: string,
        related: string,
    },
    data: any | undefined
}

/**
 *
 */
interface JsonApiResourceObject<R = any> {
    /**
     *
     */
    attributes?: Partial<{[k in Exclude<keyof R, "id" | "type">]: R[k]}>
    /**
     *
     */
    id: string
    /**
     *
     */
    links?: Record<string, JsonApiLink>
    /**
     *
     */
    meta?: any
    /**
     *
     */
    type: string
    /**
     *
     */
    relationships?: Partial<{[k in Exclude<keyof R, "id" | "type">]: JsonApiRelationshipObject}>
}

export type JsonApiPrimaryDataSingle = JsonApiResourceObject | null
type JsonApiPrimaryDataMultiple = JsonApiResourceObject[]

type JsonApiPrimaryData = JsonApiPrimaryDataMultiple | JsonApiPrimaryDataSingle

export interface JsonApiResponseBody<T extends JsonApiPrimaryData = JsonApiPrimaryData, I extends JsonApiPrimaryData = JsonApiPrimaryData> extends JsonApiResponseBodyBase {
    links?: Record<string, string>
    data?: T
    included?: I[]
}

export interface JsonApiResponseBodyMeta extends JsonApiResponseBodyBase {
    meta?: any
}

export interface JsonApiLinkObject {
    href: string
    rel?: string
    describedBy?: JsonApiAnyLink
    title?: string
    type?: string
    hreflang?: string | string[]
    meta?: any
}

type JsonApiAnyLink = JsonApiLinkObject | string | null

/**
 *
 */
export interface JsonApiResponseError {
    id?: string
    links?: {
        about?: JsonApiAnyLink,
        type?: JsonApiAnyLink,
    }
    status?: string
    code?: string
    title?: string
    detail?: string
    source?: {
        pointer?: string
        parameter?: string
        header?: string
    }
    meta?: any
}

export interface JsonApiResponseBodyError extends JsonApiResponseBodyBase {
    errors: JsonApiResponseError[]
}

export type JsonApiResponseBodyErrorWithMeta = JsonApiResponseBodyError & JsonApiResponseBodyMeta

export type JsonApiResponseBodyWithMeta<T extends JsonApiPrimaryData = JsonApiPrimaryData, I extends JsonApiPrimaryData = JsonApiPrimaryData> = JsonApiResponseBody<T, I> & JsonApiResponseBodyMeta

/**
 *
 */
export interface JsonApiError {
  status: string
  code: string
  title: string
  detail: string
}