/**
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface JsonApiResponseBodyBase {
    jsonapi?: {
        version: "1.0"
    },
    links?: Record<string, string>
}

export interface JsonApiResponseBody<T = any> extends JsonApiResponseBodyBase {
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

export type JsonApiResponseBodyWithMeta<T = any> = JsonApiResponseBody<T> & JsonApiResponseBodyMeta