'use strict'
const ourJoi = require("./ourJoi")

/**
 *
 */
module.exports = class schemaValidator {
  /**
   *
   * @param {Record<string, import("../types/ResourceConfig").ResourceConfig<any>>} resources
   * @throws
   */
  static validateAllResourceConfigs(resources) {
    for(const [resource, resourceConfig] of Object.entries(resources)) {
      for(const [attribute, joiSchema] of Object.entries(resourceConfig.attributes)) {
        const settings = ourJoi.getSettings(joiSchema)
        if (!settings) continue

        const types = settings.__one || settings.__many
        for(const type of types) {
          if (!resources[type]) {
            throw new Error(`'${resource}'.'${attribute}' is defined to hold a relation with '${type}', but '${type}' is not a valid resource name!`)
          }
        }
        const foreignRelation = settings.__as
        if (!foreignRelation) continue

        const backReference = resources[types[0]].attributes[foreignRelation]
        if (!backReference) {
          throw new Error(`'${resource}'.'${attribute}' is defined as being a foreign relation to the primary '${types[0]}'.'${foreignRelation}', but that primary relationship does not exist!`)
        }
      }
    }
  }
}