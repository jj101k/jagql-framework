/**
 *
 */
export class jsonApiErrHandler {
    /**
     * @type {((request: import("./JsonApiRequest.js").JsonApiRequest,
     * errorState: import("./JsonApiResponse.js").JsonApiError |
     * import("./JsonApiResponse.js").JsonApiError[] | any) => any) | null}
     */
    handler = null
}