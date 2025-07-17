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

interface JsonApiResourceObject {
    id: string
    type: string
    attributes?: Record<string, any>
    relationships?: Record<string, JsonApiRelationshipObject>
    links?: any
    meta?: any
}

export type JsonApiPrimaryDataSingle = JsonApiResourceObject | null
type JsonApiPrimaryDataMultiple = JsonApiResourceObject[]

type JsonApiPrimaryData = JsonApiPrimaryDataMultiple | JsonApiPrimaryDataSingle

export interface JsonApiResponseBody<T extends JsonApiPrimaryData = JsonApiPrimaryData> extends JsonApiResponseBodyBase {
    links?: Record<string, string>
    data?: T
}

export interface JsonApiResponseBodyMeta extends JsonApiResponseBodyBase {
    meta?: any
}

export interface JsonApiResponseBodyError extends JsonApiResponseBodyBase {
    errors: any[]
}

export type JsonApiResponseBodyErrorWithMeta = JsonApiResponseBodyError & JsonApiResponseBodyMeta

export type JsonApiResponseBodyWithMeta<T extends JsonApiPrimaryData = JsonApiPrimaryData> = JsonApiResponseBody<T> & JsonApiResponseBodyMeta