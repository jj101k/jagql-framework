'use strict'
const Joi = {...require('joi')}

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
   * Caches.
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns {[string, import('../types/ourJoi').OurJoiSettings][]}
   */
  getAllAttributeSettings(resourceConfig) {
    resourceConfig.attributeSettings ??= {}
    return Object.entries(resourceConfig.attributes).map(([key, schema]) => {
      if(!(key in resourceConfig.attributeSettings)) {
        resourceConfig.attributeSettings[key] = this.getSettings(schema)
      }
      return [key, resourceConfig.attributeSettings[key]]
    })
  },

  /**
   * Caches.
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @param {string} foreignKey
   * @returns
   */
  getAttributeSettings(resourceConfig, foreignKey) {
    resourceConfig.attributeSettings ??= {}
    if(!(foreignKey in resourceConfig.attributeSettings)) {
      resourceConfig.attributeSettings[foreignKey] = this.getSettings(resourceConfig.attributes[foreignKey])
    }
    return resourceConfig.attributeSettings[foreignKey]
  },

  /**
   * This is often called once per request; or as exported via getSchemaSettings
   * (perhaps for debugging); or many times on startup; or once per
   * filter-value; or once per request-item-attribute; or at other times
   *
   * @param {import('joi').Schema} schema
   * @returns {import('../types/ourJoi').OurJoiSettings}
   */
  getSettings(schema) {
    return this.getSettingsFromDescription(schema?.describe())
  },

  /**
   * This is often called once per request; or as exported via getSchemaSettings
   * (perhaps for debugging); or many times on startup; or once per
   * filter-value; or once per request-item-attribute; or at other times
   *
   * @param {import('joi').Description} description
   * @returns {import('../types/ourJoi').OurJoiSettings}
   */
  getSettingsFromDescription(description) {
    if(!description) {
      return undefined
    }
    return description.metas?.find(
      m => (typeof m == "object") && m._jagql)
  },

  Joi: Joi
}

/**
 * Adds settings if necessary, and returns them. This is used as part of write
 * functionality, so isn't used often.
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
  const obj = Joi.alternatives().try(
    Joi.any().valid(null), // null
    ...resources.map(ourJoi._joiBase),
  )

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