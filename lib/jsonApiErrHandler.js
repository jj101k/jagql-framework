/**
 *
 */
class jsonApiErrHandler {
    /**
     * @type {((request: import("../types/JsonApiRequest").JsonApiRequest,
     * errorState: import("../types/JsonApiResponse").JsonApiError |
     * import("../types/JsonApiResponse").JsonApiError[] | any) => any) | null}
     */
    static handler = null
}
module.exports = jsonApiErrHandler