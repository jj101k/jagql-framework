'use strict'
const debug = require('debug')

function overrideDebugOutputHelper (debugFns, outputFnFactory) {
  for(const key of Object.keys(debugFns).filter(key => !key.startsWith('__'))) {
    if (debugFns[key] instanceof Function) {
      debugFns[key] = outputFnFactory(debugFns[key].namespace)
      return null
    }
    return overrideDebugOutputHelper(debugFns[key], outputFnFactory)
  }
}

module.exports = class debugging {
  static handler = {
    create: debug("jsonapi-server:handler:create"),
    delete: debug("jsonapi-server:handler:delete"),
    find: debug("jsonapi-server:handler:find"),
    search: debug("jsonapi-server:handler:search"),
    update: debug("jsonapi-server:handler:update"),
  }
  static errors = debug("jsonapi-server:errors")
  static filter = debug("jsonapi-server:filter")
  static include = debug("jsonapi-server:include")
  static requestCounter = debug("jsonapi-server:requestCounter")
  static reroute = debug("jsonapi-server:reroute")
  static validationError = debug("jsonapi-server:validation:error")
  static validationInput = debug("jsonapi-server:validation:input")
  static validationOutput = debug("jsonapi-server:validation:output")

  static __overrideDebugOutput = overrideDebugOutputHelper.bind(null, debugging)
}
