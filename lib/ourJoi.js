'use strict'
const Joi = {...require('joi')}

/**
 * Send a config of the format -
 * <pre>
 *   {
 *    params: {username: jsonApi.Joi.string(), password: jsonApi.Joi.string()},
 *    get () {},
 *    post () {}
 *   }
 * </pre>
 */
Joi.action = config => {
  if (!(config.get && typeof config.get === 'function')) {
    throw new Error("'get' has to be a function")
  }
  if (!(config.post && typeof config.post === 'function')) {
    throw new Error("'post' has to be a function")
  }
  const obj = Joi.func()
  return ensureSettings(obj, settings => settings._action = config)
}

/**
 *
 */
const ourJoi = module.exports = {
  _joiBase(resourceName) {
    const relationType = Joi.object().keys({
      id: Joi.string().required(),
      type: Joi.any().required().valid(resourceName),
      meta: Joi.object().optional()
    })
    return relationType
  },

  /**
   *
   * @param {import('joi').Schema} schema
   * @returns {import('../types/ourJoi').OurJoiSettings}
   */
  getSettings(schema) {
    if(!schema) {
      return undefined
    }
    return schema.describe().metas?.find(
      m => (typeof m == "object") && m._jagql)
  },

  Joi: Joi
}

/**
 *
 * @param {import('joi').Schema} schema
 * @param {(settings: import('../types/ourJoi').OurJoiSettings, schema: import('joi').Schema) => void} addSettings
 * @returns {import('joi').Schema} This is the only copy which will have the data
 */
const ensureSettings = (schema, addSettings) => {
  let settings = ourJoi.getSettings(schema)
  if(settings) {
    addSettings(settings, schema)
    return schema
  }
  settings = {_jagql: true}
  schema = schema.meta(settings)
  addSettings(settings, schema)
  return schema
}

/**
 *
 * @param  {...string} resources
 * @returns
 */
Joi.one = (...resources) => {
  resources.forEach(resource => {
    if (typeof resource !== 'string') throw new Error('Expected a string when defining a primary relation via .one()')
  })
  const obj = Joi.alternatives().try(...[
    Joi.any().valid(null) // null
  ].concat(resources.map(ourJoi._joiBase)))

  return ensureSettings(obj, (settings, schema) => {
    settings.__one = resources
    settings._uidType = "string"

    schema.uidType = function (keyType) {
      if (keyType !== 'uuid' && keyType !== 'autoincrement') {
        throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
      }
      settings._uidType = keyType
      return schema
    }
  })
}
/**
 *
 * @param  {...string} resources
 * @returns
 */
Joi.many = function (...resources) {
  resources.forEach(resource => {
    if (typeof resource !== 'string') throw new Error('Expected a string when defining a primary relation via .many()')
  })
  const obj = Joi.array().items(...resources.map(ourJoi._joiBase))
  return ensureSettings(obj, (settings, schema) => {
    settings.__many = resources
    settings._uidType = "string"

    schema.uidType = function (keyType) {
      if (keyType !== 'uuid' && keyType !== 'autoincrement') {
        throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
      }
      settings._uidType = keyType
      return schema
    }
  })
}
Joi._validateForeignRelation = config => {
  if (!config.as) throw new Error("Missing 'as' property when defining a foreign relation")
  if (!config.resource) throw new Error("Missing 'resource' property when defining a foreign relation")
}
Joi.belongsToOne = config => {
  Joi._validateForeignRelation(config)
  const obj = Joi.alternatives().try(
    Joi.any().valid(null), // null
    ourJoi._joiBase(config.resource)
  )
  return ensureSettings(obj, settings => {
    settings.__one = [ config.resource ]
    settings.__as = config.as
  })
}
Joi.belongsToMany = config => {
  Joi._validateForeignRelation(config)
  const obj = Joi.array().items(ourJoi._joiBase(config.resource))
  return ensureSettings(obj, settings => {
    settings.__many = [ config.resource ]
    settings.__as = config.as
  })
}