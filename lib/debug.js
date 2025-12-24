'use strict'
import _debug from "debug"

/**
 *
 * @param {*} debugFns
 * @param {*} outputFnFactory
 * @returns
 */
const overrideDebugOutputHelper = (debugFns, outputFnFactory) => {
    for(const key of Object.keys(debugFns).filter(key => !key.startsWith('__'))) {
        if (debugFns[key] instanceof Function) {
            debugFns[key] = outputFnFactory(debugFns[key].namespace)
            return null
        }
        return overrideDebugOutputHelper(debugFns[key], outputFnFactory)
    }
}

/**
 * @readonly
 */
export const debug = {
    handler: {
        create: _debug("jsonapi-server:handler:create"),
        delete: _debug("jsonapi-server:handler:delete"),
        find: _debug("jsonapi-server:handler:find"),
        search: _debug("jsonapi-server:handler:search"),
        update: _debug("jsonapi-server:handler:update"),
    },
    errors: _debug("jsonapi-server:errors"),
    filter: _debug("jsonapi-server:filter"),
    include: _debug("jsonapi-server:include"),
    requestCounter: _debug("jsonapi-server:requestCounter"),
    reroute: _debug("jsonapi-server:reroute"),
    validationError: _debug("jsonapi-server:validation:error"),
    validationInput: _debug("jsonapi-server:validation:input"),
    validationOutput: _debug("jsonapi-server:validation:output"),

    /**
     *
     * @param {*} outputFnFactory
     * @returns
     */
    __overrideDebugOutput: (outputFnFactory) => overrideDebugOutputHelper(debug, outputFnFactory),
}
