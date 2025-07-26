'use strict'
const debug = require('debug')

function overrideDebugOutputHelper (debugFns, outputFnFactory) {
  Object.keys(debugFns).filter(key => key.substr(0, 2) !== '__').forEach(key => {
    if (debugFns[key] instanceof Function) {
      debugFns[key] = outputFnFactory(debugFns[key].namespace)
      return null
    }
    return overrideDebugOutputHelper(debugFns[key], outputFnFactory)
  })
}

module.exports = class debugging {
  static handler = {
    search: debug('jagql:handler:search'),
    find: debug('jagql:handler:find'),
    create: debug('jagql:handler:create'),
    update: debug('jagql:handler:update'),
    delete: debug('jagql:handler:delete')
  }
  static reroute = debug('jagql:reroute')
  static include = debug('jagql:include')
  static filter = debug('jagql:filter')
  static validationInput = debug('jagql:validation:input')
  static validationOutput = debug('jagql:validation:output')
  static validationError = debug('jagql:validation:error')
  static errors = debug('jagql:errors')
  static requestCounter = debug('jagql:requestCounter')

  static __overrideDebugOutput = overrideDebugOutputHelper.bind(null, debugging)
}
