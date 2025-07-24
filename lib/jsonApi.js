'use strict'

// Forward declaration needed due to require loop
const jsonApi = module.exports = {
  /**
   * @public
   * @type {Record<string, import("../types/ResourceConfig.js").ResourceConfig<any>>}
   */
  _resources: { },
  /**
   * @public
   * @type {import('../types/jsonApi').ApiConfig}
   */
  _apiConfig: { },
  /**
   * @public
   */
  _errHandler: null,
  onUncaughtException(errHandler) {
    this._errHandler = errHandler
  },
}

const ourJoi = require('./ourJoi.js')
const router = require('./router.js')
const responseHelper = require('./responseHelper.js')
const handlerEnforcer = require('./handlerEnforcer.js')
const pagination = require('./pagination.js')
const routes = require('./routes')
const metrics = require('./metrics.js')
const schemaValidator = require('./schemaValidator.js')
const version = require(require('path').join(__dirname, '../package.json')).version
const MemoryHandler = require('./handlers/MemoryHandler')
const ChainHandler = require('./handlers/ChainHandler')
const urlTools = require("./urlTools.js")

const cleanBaseUrl = (base) => {
  if (!base) {
    base = ''
  }
  if (base[0] !== '/') {
    base = `/${base}`
  }
  if (base[base.length - 1] !== '/') {
    base += '/'
  }
  return base
}



jsonApi._version = version

jsonApi.Joi = ourJoi.Joi
jsonApi.metrics = metrics.emitter
jsonApi.MemoryHandler = MemoryHandler
jsonApi.ChainHandler = ChainHandler

/**
 *
 * @param {import('../types/jsonApi').ApiConfig} apiConfig
 */
jsonApi.setConfig = function(apiConfig) {
  this._apiConfig = apiConfig
  this._apiConfig.base = cleanBaseUrl(this._apiConfig.base)
  this._apiConfig.pathPrefix = apiConfig.urlPrefixAlias ||
    urlTools.concatenateUrlPrefix(this._apiConfig, true)
  responseHelper.setBaseUrl(this._apiConfig.pathPrefix)
  responseHelper.setMetadata(this._apiConfig.meta)
}

jsonApi.authenticate = router.authenticateWith.bind(router)

/**
 *
 * @type {import("../types/jsonApi").define}
 */
jsonApi.define = function(resourceConfig, options) {
  if (!resourceConfig.resource.match(/^[A-Za-z0-9_]*$/)) {
    throw new Error(`Resource '${resourceConfig.resource}' contains illegal characters!`)
  }
  resourceConfig.namespace = resourceConfig.namespace || 'default'
  resourceConfig.searchParams = resourceConfig.searchParams || { }
  resourceConfig.actions = resourceConfig.actions || {}
  this._resources[resourceConfig.resource] = resourceConfig

  handlerEnforcer.wrap(resourceConfig.handlers)

  resourceConfig.handlers.initialise = resourceConfig.handlers.initialise || resourceConfig.handlers.initialize
  if (resourceConfig.handlers.initialise) {
    resourceConfig.handlers.initialise(resourceConfig)
  }

  Object.keys(resourceConfig.attributes).forEach(attribute => {
    if (!attribute.match(/^[A-Za-z0-9_]*$/)) {
      throw new Error(`Attribute '${attribute}' on ${resourceConfig.resource} contains illegal characters!`)
    }
  })
  Object.keys(resourceConfig.actions).forEach(action => {
    if (!action.match(/^[A-Za-z0-9_]*$/)) {
      throw new Error(`Attribute '${action}' on ${resourceConfig.resource} contains illegal characters!`)
    }
  })

  resourceConfig.searchParams = {
    type: ourJoi.Joi.any().required().valid(resourceConfig.resource)
      .description(`Always "${resourceConfig.resource}"`)
      .example(resourceConfig.resource),
    sort: ourJoi.Joi.any()
      .description('An attribute to sort by')
      .example('title'),
    filter: ourJoi.Joi.any()
      .description('An attribute+value to filter by')
      .example('title'),
    fields: ourJoi.Joi.any()
      .description('An attribute+value to filter by')
      .example('title'),
    include: ourJoi.Joi.any()
      .description('An attribute to include')
      .example('title'),
    ...resourceConfig.searchParams,
    ...pagination.joiPageDefinition
  }

  const idType = ourJoi.Joi.string()
  const idTypeSpec = (options?.idRequired === false) ? idType.optional() :
    idType.required()

  resourceConfig.attributes = {
    id: idTypeSpec
      .description('Unique resource identifier')
      .example('1234'),
    type: ourJoi.Joi.string().required().valid(resourceConfig.resource)
      .description(`Always "${resourceConfig.resource}"`)
      .example(resourceConfig.resource),
    meta: ourJoi.Joi.object().optional(),
    ...resourceConfig.attributes,
  }

  resourceConfig.onCreate = Object.fromEntries(
    Object.keys(resourceConfig.attributes).filter(
      i => {
        /**
         * @type {import('joi').Schema}
         */
        const schema = resourceConfig.attributes[i]
        const describe = schema.describe()
        const settings = ourJoi.getSettings(schema)
        return !describe.metas?.includes("readonly") &&
        !settings?.__as
    }).map(k => [k, resourceConfig.attributes[k]])
  )
}

jsonApi.getExpressServer = () => router.getExpressServer()

jsonApi.getSchemaSettings = ourJoi.getSettings.bind(ourJoi)

jsonApi.start = function(cb) {
  schemaValidator.validate(this._resources)
  router.applyMiddleware()
  routes.register()
  if (!this._apiConfig.router) {
    router.listen(this._apiConfig.port, cb)
  }
}.bind(jsonApi)

jsonApi.close = function() {
  router.close()
  metrics.emitter.removeAllListeners('data')
  for (const i in this._resources) {
    const resourceConfig = this._resources[i]
    if (resourceConfig.handlers.close) resourceConfig.handlers.close()
  }
}.bind(jsonApi)