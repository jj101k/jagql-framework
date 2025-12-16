'use strict'
import { Relationship } from "./Relationship.js"
import { RemoteRelationship } from "./RemoteRelationship.js"

/**
 *
 */
export class schemaValidator {
  /**
   * This should be called once on startup.
   *
   * @param {Record<string, import("../types/ResourceConfig.js").ResourceConfig<any>>} resources
   * @throws
   */
  static validateAllResourceConfigs(resources) {
    for(const [resource, resourceConfig] of Object.entries(resources)) {
      for(const [attribute, rel] of Relationship.getAllRelationships(resourceConfig)) {
        if(attribute == "relationships") {
          throw new Error(`'${resource}' invalidly has a relationship called '${attribute}'`)
        }
        const types = rel.resources
        for(const type of types) {
          if (!resources[type]) {
            throw new Error(`'${resource}'.'${attribute}' is defined to hold a relationship with '${type}', but '${type}' is not a valid resource name!`)
          }
        }
        if(!RemoteRelationship.isRemoteRelationship(rel)) continue
        const foreignRelationship = rel.remoteKey

        const backReference = resources[types[0]].attributes[foreignRelationship]
        if (!backReference) {
          throw new Error(`'${resource}'.'${attribute}' is defined as being a foreign relationship to the primary '${types[0]}'.'${foreignRelationship}', but that primary relationship does not exist!`)
        }
      }
    }
  }
}