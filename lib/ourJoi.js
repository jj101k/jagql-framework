"use strict"
const Joi = require("joi")
const Relation = require("./Relation")
const JoiCompat = require("./JoiCompat")
const RelationStore = require("./RelationStore")

/**
 *
 */
class ourJoi {
  static Joi = {
    ...Joi,

    /**
     * Adds settings if necessary, and returns them. This is used as part of write
     * functionality, so isn't used often.
     *
     * @param {import('joi').Schema} schema
     * @returns {{settings: import("../types/ourJoi").OurJoiSettings, schema: import('joi').Schema}} This is the only copy which will have the data
     */
    _ensureSettings(schema) {
      let settings = JoiCompat.getSettings(schema)
      if(!settings) {
        settings = {_jagql: true}
        schema = schema.meta(settings)
      }
      return {settings, schema}
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
     * @param {string | string[]} resourceOrResources
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    manyOf(resourceOrResources, required = false, uidType) {
      const relation = Relation.manyOf(resourceOrResources, required, uidType)
      const {settings, schema} = this._ensureSettings(relation.schema)
      settings.__relation = RelationStore.addRelation(relation)
      return schema
    },
    /**
     *
     * @param {string | string[]} resourceOrResources
     * @param {boolean} required
     * @param {"string" | "uuid" | "autoincrement"} [uidType]
     * @returns
     */
    oneOf(resourceOrResources, required = false, uidType) {
      const relation = Relation.oneOf(resourceOrResources, required, uidType)
      const {settings, schema} = this._ensureSettings(relation.schema)
      settings.__relation = RelationStore.addRelation(relation)
      return schema
    },
    /**
     * @deprecated Please use oneOf()
     *
     * @param  {...string} resources
     * @returns
     */
    one(...resources) {
      const obj = this.oneOf(resources)
      const {settings, schema} = this._ensureSettings(obj)
      schema.uidType = function (keyType) {
        if (keyType !== 'uuid' && keyType !== 'autoincrement') {
          throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
        }
        RelationStore.getRelation(settings.__relation).uidType = keyType
        return schema
      }
      return schema
    },
    /**
     * @deprecated Please use manyOf()
     *
     * @param  {...string} resources
     * @returns
     */
    many(...resources) {
      const obj = this.manyOf(resources)
      const {settings, schema} = this._ensureSettings(obj)
      schema.uidType = function (keyType) {
        if (keyType !== 'uuid' && keyType !== 'autoincrement') {
          throw new Error('Resources can be related only via UUID or AUTOINCREMENT keys')
        }
        RelationStore.getRelation(settings.__relation).uidType = keyType
        return schema
      }
      return schema
    },
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToOne(config) {
      const relation = Relation.belongsToOneOf(config)
      const {settings, schema} = this._ensureSettings(relation.schema)
      settings.__relation = RelationStore.addRelation(relation)
      return schema
    },
    /**
     *
     * @param {import("../types/ourJoi").ModelOptions} config
     * @returns
     */
    belongsToMany(config) {
      const relation = Relation.belongsToManyOf(config)
      const {settings, schema} = this._ensureSettings(relation.schema)
      settings.__relation = RelationStore.addRelation(relation)
      return schema
    }
  }
}

module.exports = ourJoi