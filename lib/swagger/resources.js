'use strict'
const Joi = require('joi')
const jsonApi = require('../jsonApi')
const ourJoi = require("../ourJoi")

/**
 * Compat: Joi 17
 */
module.exports = class swaggerResources {
  /**
   *
   * @returns
   */
  static getResourceDefinitions = () => {
    const resourceDefinitions = { }

    for (const resource in jsonApi._resources) {
      resourceDefinitions[resource] = this.#getResourceDefinition(jsonApi._resources[resource])
    }
    resourceDefinitions.error = this.#getErrorDefinition()

    return resourceDefinitions
  }

  /**
   *
   * @param {import('../../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static #getResourceDefinition(resourceConfig) {
    if (Object.keys(resourceConfig.handlers || { }).length === 0) return undefined

    const resourceDefinition = {
      description: resourceConfig.description,
      type: 'object',
      // required: [ "id", "type", "attributes", "relationships", "links" ],
      properties: {
        'id': {
          type: 'string'
        },
        'type': {
          type: 'string'
        },
        'attributes': {
          type: 'object',
          properties: { }
        },
        'relationships': {
          type: 'object',
          properties: { }
        },
        'links': {
          type: 'object',
          properties: {
            self: {
              type: 'string'
            }
          }
        },
        'meta': {
          type: 'object'
        }
      }
    }
    const attributeShortcut = resourceDefinition.properties.attributes.properties
    const relationshipsShortcut = resourceDefinition.properties.relationships.properties

    const attributes = resourceConfig.attributes
    for (const [attribute, attrSchema] of Object.entries(attributes)) {
      if ((attribute === 'id') || (attribute === 'type') || (attribute === 'meta')) continue

      const settings = ourJoi.getSettings(attrSchema)
      if (settings) {
        if (settings.as) continue

        relationshipsShortcut[attribute] =
          swaggerResources.#getRelationshipSchema(attrSchema)
      } else {
        attributeShortcut[attribute] =
          swaggerResources.#getAttributeSchema(attrSchema)

        const describe = attrSchema.describe()

        if (describe.flags?.presence === 'required') {
          resourceDefinition.properties.attributes.required ||= [ ]
          resourceDefinition.properties.attributes.required.push(attribute)
        }
      }
    }

    return resourceDefinition
  }

  /**
   *
   * @param {import('joi').Schema} attrSchema
   * @returns
   */
  static #getAttributeSchema(attrSchema) {
    /**
     *
     * @param {Joi.Description} describe
     * @returns
     */
    const getInnerSchema = (describe) => {
      switch(describe.type) {
        case "date":
          return {
            type: "string",
            format: "date",
          }
        case "array": {
          const itemsIn = describe.items
          const items = { type: 'object' }
          if (itemsIn[0]?.keys) {
            items.properties = Object.fromEntries(
              Object.entries(itemsIn[0].keys).map(([iKey, iSchemaDesc]) => [iKey, { type: iSchemaDesc.type }])
            )
          }

          return {
            type: "array",
            items,
          }
        }
        case "boolean": // Fall through
        case "object": // Fall through
        case "number": // Fall through
        case "string": {
          return {type: describe.type}
        }
        case "alternatives": {
          return {
            oneOf: describe.matches.map(m => getInnerSchema(m.schema))
          }
        }
        case "any": {
          return {}
        }
        default:
          throw new Error(`Cannot interpret Joi type '${describe.type}' as a JSON-Schema type`)
      }
    }
    const describe = attrSchema.describe()
    const swaggerSchema = getInnerSchema(describe)
    if (describe.description) {
      swaggerSchema.description = describe.description
    }

    return swaggerSchema
  }

  /**
   *
   * @param {import('joi').Schema} attrSchema
   * @returns
   */
  static #getRelationshipSchema(attrSchema) {
    const describe = attrSchema.describe()
    const itemSchema = {
      type: 'object',
      required: ['type', 'id'],
      properties: {
        type: {
          type: 'string'
        },
        id: {
          type: 'string'
        },
        meta: {
          type: 'object'
        }
      }
    }
    const settings = ourJoi.getSettings(attrSchema)
    const dataProperty = settings.__many ? {
        type: 'array',
        items: itemSchema,
      } : itemSchema
    const swaggerSchema = {
      type: 'object',
      properties: {
        meta: {
          type: 'object'
        },
        links: {
          type: 'object',
          properties: {
            self: {
              type: 'string'
            },
            related: {
              type: 'string'
            }
          }
        },
        data: dataProperty,
      }
    }

    if (describe.flags?.presence === 'required') {
      if (settings.__many) {
        swaggerSchema.required = true
      } else {
        swaggerSchema.required = ['type', 'id']
      }
    }
    return swaggerSchema
  }

  static #getErrorDefinition() {
    return {
      type: 'object',
      required: [ 'jsonapi', 'meta', 'links', 'errors' ],

      properties: {
        jsonapi: {
          type: 'object',
          required: [ 'version' ],
          properties: {
            version: {
              type: 'string'
            }
          }
        },
        meta: {
          type: 'object'
        },
        links: {
          type: 'object',
          properties: {
            self: {
              type: 'string'
            }
          }
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'status', 'code', 'title', 'detail'
            ],
            properties: {
              status: {
                type: 'string'
              },
              code: {
                type: 'string'
              },
              title: {
                type: 'string'
              },
              detail: {
                type: 'object'
              }
            }
          }
        }
      }
    }
  }
}
