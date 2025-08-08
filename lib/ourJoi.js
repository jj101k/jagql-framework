"use strict"
const Joi = require("joi")

/**
 *
 */
class ourJoi {
  /**
   * Caches.
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns {[string, import('../types/ourJoi').OurJoiSettings][]}
   */
  static getAllAttributeSettings(resourceConfig) {
    resourceConfig.attributeSettings ??= {}
    return Object.entries(resourceConfig.attributes).map(([key, schema]) => {
      if(!(key in resourceConfig.attributeSettings)) {
        resourceConfig.attributeSettings[key] = this.getSettings(schema)
      }
      return [key, resourceConfig.attributeSettings[key]]
    })
  }

  /**
   * Caches.
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @param {string} foreignKey
   * @returns
   */
  static getAttributeSettings(resourceConfig, foreignKey) {
    resourceConfig.attributeSettings ??= {}
    if(!(foreignKey in resourceConfig.attributeSettings)) {
      resourceConfig.attributeSettings[foreignKey] = this.getSettings(resourceConfig.attributes[foreignKey])
    }
    return resourceConfig.attributeSettings[foreignKey]
  }

  /**
   * This is often called once per request; or as exported via getSchemaSettings
   * (perhaps for debugging); or many times on startup; or once per
   * filter-value; or once per request-item-attribute; or at other times
   *
   * @param {import('joi').Schema} schema
   * @returns {import('../types/ourJoi').OurJoiSettings}
   */
  static getSettings(schema) {
    return this.getSettingsFromDescription(schema?.describe())
  }

  /**
   * This is often called once per request; or as exported via getSchemaSettings
   * (perhaps for debugging); or many times on startup; or once per
   * filter-value; or once per request-item-attribute; or at other times
   *
   * @param {import('joi').Description} description
   * @returns {import('../types/ourJoi').OurJoiSettings}
   */
  static getSettingsFromDescription(description) {
    if(!description) {
      return undefined
    }
    return description.metas?.find(
      m => (typeof m == "object") && m._jagql)
  }

  static Joi = {
    ...Joi,

    /**
     * Adds settings if necessary, and returns them. This is used as part of write
     * functionality, so isn't used often.
     *
     * @param {import('joi').Schema} schema
     * @param {(settings: import('../types/ourJoi').OurJoiSettings, schema: import('joi').Schema) => void} addSettings
     * @returns {import('joi').Schema} This is the only copy which will have the data
     */
    _ensureSettings(schema, addSettings) {
      let settings = ourJoi.getSettings(schema)
      if(settings) {
        addSettings(settings, schema)
        return schema
      }
      settings = {_jagql: true}
      schema = schema.meta(settings)
      addSettings(settings, schema)
      return schema
    },
    /**
     *
     * @param {string} resourceName
     * @returns
     */
    _joiBase(resourceName) {
      const relationType = this.object().keys({
        id: this.string().required(),
        type: this.any().required().valid(resourceName),
        meta: this.object().optional()
      })
      return relationType
    },

    /**
     *
     * @param  {...string} resources
     * @returns
     */
    one(...resources) {
      for(const resource of resources) {
        if (typeof resource !== 'string') throw new Error('Expected a string when defining a primary relation via .one()')
      }
      const obj = this.alternatives().try(
        this.any().valid(null), // null
        ...resources.map(resourceName => this._joiBase(resourceName)),
      )

      return this._ensureSettings(obj, (settings, schema) => {
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
    },
    /**
     *
     * @param  {...string} resources
     * @returns
     */
    many(...resources) {
      for(const resource of resources) {
        if (typeof resource !== 'string') throw new Error('Expected a string when defining a primary relation via .many()')
      }
      const obj = this.array().items(...resources.map(resourceName => this._joiBase(resourceName)))
      return this._ensureSettings(obj, (settings, schema) => {
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
    },
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     */
    _validateForeignRelation(config) {
      if (!config.as) throw new Error("Missing 'as' property when defining a foreign relation")
      if (!config.resource) throw new Error("Missing 'resource' property when defining a foreign relation")
    },
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToOne(config) {
      this._validateForeignRelation(config)
      const obj = this.alternatives().try(
        this.any().valid(null), // null
        this._joiBase(config.resource)
      )
      return this._ensureSettings(obj, settings => {
        settings.__one = [ config.resource ]
        settings.__as = config.as
      })
    },
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToMany(config) {
      this._validateForeignRelation(config)
      const obj = this.array().items(this._joiBase(config.resource))
      return this._ensureSettings(obj, settings => {
        settings.__many = [ config.resource ]
        settings.__as = config.as
      })
    }
  }
}

module.exports = ourJoi