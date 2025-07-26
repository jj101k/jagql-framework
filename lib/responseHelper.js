'use strict'
const pagination = require('./pagination.js')
const Joi = require('joi')
const debug = require('./debugging.js')
const ourJoi = require("./ourJoi.js")
const tools = require('./tools.js')

/**
 *
 * @param {*} schema
 * @returns
 */
function getLinkProperties(schema) {
  return Object.keys(schema).filter(someProperty => isSpecialProperty(schema[someProperty]))
}

/**
 *
 * @param {*} v
 * @returns
 */
function isPromise (v) {
  return (typeof v === 'object') && (typeof v?.then === 'function')
}

/**
 *
 * @param {import('joi').Schema} value
 * @returns
 */
const isSpecialProperty = value => {
  if (!(value instanceof Object)) return false
  if (ourJoi.getSettings(value)) return true
  return false
}

/**
 * @template {any} T
 * @param {T} item
 * @param {import("../types/ResourceConfig").ResourceAttributes<Partial<T>>} schema
 */
async function loadPromises (item, schema) {
  const itemOut = {}
  for (const k in schema) {
    const v = item[k]
    if (isPromise(v)) {
      itemOut[k] = await v
    } else {
      itemOut[k] = v
    }
  }
  return itemOut
}

/**
 * @param item
 * @param schema
 */
function convertId (item, schema) {
  if (item.id) {
    item.id = '' + item.id
  }
  for(const p of getLinkProperties(schema)) {
    const v = item[p]
    if(!v) continue
    if(Array.isArray(v)) {
      item[p] = v.map(vi => ({id: '' + vi.id, type: vi.type, meta: vi.meta}))
    } else {
      item[p] = {id: '' + v.id, type: v.type, meta: v.meta}
    }
  }
}

/**
 *
 */
module.exports = class responseHelper {
  static #baseUrl
  static #metadata

  static setBaseUrl(baseUrl) {
    this.#baseUrl = baseUrl
  }
  static setMetadata(meta) {
    this.#metadata = meta
  }

  /**
   *
   * Checks output data against the schema
   *
   * @template R
   * @param {R[]} items
   * @param {import("../types/ResourceConfig").ResourceAttributes<any>} schema
   */
  static async checkSchemaOnArray(items, schema) {
    // Only check the first 10 items, for basic sanity checks
    const checkItems = items.slice(0, 10)

    const result = []
    const compiledSchema = Joi.compile(schema)
    for (const cItem of checkItems) {
      const item = await loadPromises(cItem, schema)
      convertId(item, schema)

      debug.validationOutput(JSON.stringify(item))
      const validationResult = compiledSchema.validate(item)
      if (validationResult.error) {
        debug.validationError(validationResult.error.message,
          JSON.stringify(item))
      }
    }

    // Whatever happens, we return the success response with all items
    for (const item of items) {
      result.push(await this.#generateDataItem(item, schema))
    }
    return result
  }

  /**
   * @public
   *
   * @param {*} cItem
   * @param {import('../types/ResourceConfig').ResourceAttributes} schema
   * @returns
   */
  static async _checkSchemaOnObject(cItem, schema) {
    debug.validationOutput(JSON.stringify(cItem))
    const item = await loadPromises(cItem, schema)
    convertId(item, schema)
    const compiledSchema = Joi.compile(schema)
    const validationResult = compiledSchema.validate(item)
    if (validationResult.error) {
      debug.validationError(validationResult.error.message, JSON.stringify(item))
    }

    return this.#generateDataItem(validationResult.value, schema)
  }

  /**
   * @public
   *
   * @param {*} cItem
   * @param {import('../types/ResourceConfig').ResourceAttributes} schema
   * @throws
   * @returns
   */
  static async _enforceSchemaOnObject(cItem, schema) {
    debug.validationOutput(JSON.stringify(cItem))
    const item = await loadPromises(cItem, schema)
    convertId(item, schema)
    const compiled = Joi.compile(schema)
    const validationResult = compiled.validate(item)
    if (validationResult.error) {
      debug.validationError(validationResult.error.message, JSON.stringify(item))
      throw {
        status: '500',
        code: 'EINVALIDITEM',
        title: 'Item in response does not validate',
        detail: {
          item: item,
          error: validationResult.error.message
        }
      }
    }

    const dataItem = await this.#generateDataItem(validationResult.value, schema)
    return dataItem
  }

  /**
   *
   * @param {*} item
   * @param {*} schema
   * @returns
   */
  static async #generateDataItem(item, schema) {
    const linkProperties = getLinkProperties(schema)
    const attributeProperties = Object.keys(schema).filter(someProperty => {
      if (someProperty === 'id') return false
      if (someProperty === 'type') return false
      if (someProperty === 'meta') return false
      return !isSpecialProperty(schema[someProperty])
    })

    const attributes = Object.fromEntries(
      attributeProperties.filter(p => p in item).map(p => [p, item[p]]))

    const result = {
      type: item.type,
      id: '' + item.id,
      attributes,
      links: this.#generateLinks(item, schema, linkProperties),
      relationships: await this.#generateRelationships(item, schema, linkProperties),
      meta: item.meta
    }

    return result
  }

  static #generateLinks(item) {
    return {
      self: `${this.#baseUrl + item.type}/${item.id}`
    }
  }

  /**
   *
   * @param {*} item
   * @param {*} schema
   * @param {*} linkProperties
   * @returns
   */
  static async #generateRelationships(item, schema, linkProperties) {
    if (linkProperties.length === 0) return undefined

    const links = { }

    for (const linkProperty of linkProperties) {
      links[linkProperty] = await this.#generateLink(item, schema[linkProperty], linkProperty)
    }

    return links
  }

  /**
   *
   * @param {*} item
   * @param {*} schemaProperty
   * @param {*} linkProperty
   * @returns
   */
  static async #generateLink(item, schemaProperty, linkProperty) {
    const settings = ourJoi.getSettings(schemaProperty)
    const link = {
      meta: {
        relation: 'primary',
        // type: settings.__many || settings.__one,
        readOnly: false
      },
      links: {
        self: `${this.#baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
        related: `${this.#baseUrl + item.type}/${item.id}/${linkProperty}`
      },
      data: undefined
    }

    if (settings.__many && item[linkProperty] !== undefined) {
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      link.data = [ ]
      const linkItemOrItems = isPromise(item[linkProperty]) ? await item[linkProperty] : item[linkProperty]
      if (linkItemOrItems) {
        const linkItems = tools.ensureArrayNotNullish(linkItemOrItems)
        link.data.push(...linkItems.map(linkItem => ({
          type: linkItem.type,
          id: '' + linkItem.id,
          meta: linkItem.meta
        })))
      }
    }

    if (settings.__one) {
      link.data = null
      const linkItem = isPromise(item[linkProperty]) ? await item[linkProperty] : item[linkProperty]
      if (linkItem) {
        // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
        link.data = {
          type: linkItem.type,
          id: '' + linkItem.id,
          meta: linkItem.meta
        }
      }
    }

    if (settings.__as) {
      const relatedResource = (settings.__one || settings.__many)[0]
      // get information about the linkage - list of ids and types
      // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
      link.links.self = `${this.#baseUrl + relatedResource}/relationships/?${settings.__as}=${item.id}`
      // get full details of all linked resources
      // /rest/bookings/?filter[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
      link.links.related = `${this.#baseUrl + relatedResource}/?filter[${settings.__as}]=${item.id}`
      if (item[linkProperty]) {
        link.data = null
      } else {
        // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
        link.data = undefined
      }
      link.meta = {
        relation: 'foreign',
        belongsTo: relatedResource,
        as: settings.__as,
        many: !!settings.__many,
        readOnly: true
      }
    }

    return link
  }

  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {*} errOrErrs
   * @returns {import('../types/JsonApiResponse.js').JsonApiResponseBodyErrorWithMeta}
   */
  static generateError(request, errOrErrs) {
    debug.errors(request.route.verb, request.route.combined, JSON.stringify(errOrErrs))
    const errs = tools.ensureArray(errOrErrs)

    const errorResponse = {
      jsonapi: {
        version: '1.0'
      },
      meta: this._generateMeta(request),
      links: {
        self: this.#baseUrl + request.route.path
      },
      errors: errs.map(error => ({
        status: error.status,
        code: error.code,
        title: error.title,
        detail: error.detail
      }))
    }

    return errorResponse
  }

  /**
   * @public
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {*} resourceConfig
   * @param {*} sanitisedData
   * @param {*} handlerTotal
   * @returns {import('../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta}
   */
  static _generateResponse(request, resourceConfig, sanitisedData, handlerTotal) {
    return {
      jsonapi: {
        version: '1.0'
      },

      meta: this._generateMeta(request, handlerTotal),

      links: {
        self: this.#baseUrl + request.route.path + (request.route.query ? ('?' + request.route.query) : ''),
        ...pagination.generatePageLinks(request, handlerTotal),
      },

      data: sanitisedData
    }
  }

  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @returns
   */
  static #getMetadata(request) {
    if (typeof this.#metadata === 'function') {
      return this.#metadata(request)
    } else {
      return {...this.#metadata}
    }
  }

  /**
   * @public
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {*} handlerTotal
   * @returns
   */
  static _generateMeta(request, handlerTotal) {
    const meta = this.#getMetadata(request)

    if (handlerTotal) {
      meta.page = pagination.generateMetaSummary(request, handlerTotal)
    }

    return meta
  }

  /**
   * @public
   */
  static _isPromise = isPromise
}