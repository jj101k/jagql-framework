'use strict'
import _debug from "debug"

function overrideDebugOutputHelper (debugFns, outputFnFactory) {
  for(const key of Object.keys(debugFns).filter(key => !key.startsWith('__'))) {
    if (debugFns[key] instanceof Function) {
      debugFns[key] = outputFnFactory(debugFns[key].namespace)
      return null
    }
    return overrideDebugOutputHelper(debugFns[key], outputFnFactory)
  }
}

/**
 *
 */
export class debug {
  static handler = {
    create: _debug("jsonapi-server:handler:create"),
    delete: _debug("jsonapi-server:handler:delete"),
    find: _debug("jsonapi-server:handler:find"),
    search: _debug("jsonapi-server:handler:search"),
    update: _debug("jsonapi-server:handler:update"),
  }
  static errors = _debug("jsonapi-server:errors")
  static filter = _debug("jsonapi-server:filter")
  static include = _debug("jsonapi-server:include")
  static requestCounter = _debug("jsonapi-server:requestCounter")
  static reroute = _debug("jsonapi-server:reroute")
  static validationError = _debug("jsonapi-server:validation:error")
  static validationInput = _debug("jsonapi-server:validation:input")
  static validationOutput = _debug("jsonapi-server:validation:output")

  static __overrideDebugOutput = overrideDebugOutputHelper.bind(null, debug)
}
