'use strict'
const pagination = require('./pagination.js')
const Joi = require('joi')
const debug = require('./debugging.js')
const tools = require('./tools.js')
const Relation = require('./Relation.js')
const RemoteRelation = require('./RemoteRelation.js')
const Prop = require('./Prop.js')

/**
 *
 * @param {*} v
 * @returns
 */
function isPromise (v) {
  return (typeof v === 'object') && (typeof v?.then === 'function')
}

/**
 * @template {any} T
 * @param {T} item
 * @param {import('../types/ResourceConfig').ResourceConfig<T>} resourceConfig
 * @returns {Promise<T>}
 */
async function loadPromises (item, resourceConfig) {
  const itemOut = {}
  for (const k in resourceConfig.attributes) {
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
 *
 */
module.exports = class responseHelper {
  static #baseUrl
  static #metadata

  /**
   * Called once per validated object
   *
   * @param {*} item
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   */
  static #convertId(item, resourceConfig) {
    if (item.id) {
      item.id = '' + item.id
    }
    for(const p of this.#getLinkProperties(resourceConfig)) {
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
   * Called 1-2 times for every datum produced by a request
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static #getLinkProperties(resourceConfig) {
    return Relation.getAllRelations(resourceConfig).map(([k]) => k)
  }

  static setBaseUrl(baseUrl) {
    this.#baseUrl = baseUrl
  }
  static setMetadata(meta) {
    this.#metadata = meta
  }

  /**
   * Called for search endpoints (once per request)
   *
   * Checks output data against the schema
   *
   * @template R
   * @param {R[]} items
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   */
  static async checkSchemaOnArray(items, resourceConfig) {
    // Only check the first 10 items, for basic sanity checks
    const checkItems = items.slice(0, 10)

    const result = []
    const compiledSchema = Joi.compile(Prop.getAllSchemas(resourceConfig))
    for (const cItem of checkItems) {
      const item = await loadPromises(cItem, resourceConfig)
      this.#convertId(item, resourceConfig)

      debug.validationOutput(JSON.stringify(item))
      const validationResult = compiledSchema.validate(item)
      if (validationResult.error) {
        debug.validationError(validationResult.error.message,
          JSON.stringify(item))
      }
    }

    // Whatever happens, we return the success response with all items
    for await (const r of this.#generateDataItems(items, resourceConfig)) {
      result.push(r)
    }
    return result
  }

  /**
   * Routinely called at the end of single-object requests
   *
   * @param {*} cItem
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static async checkSchemaOnObject(cItem, resourceConfig) {
    debug.validationOutput(JSON.stringify(cItem))
    const item = await loadPromises(cItem, resourceConfig)
    this.#convertId(item, resourceConfig)
    const compiledSchema = Joi.compile(Prop.getAllSchemas(resourceConfig))
    const validationResult = compiledSchema.validate(item)
    if (validationResult.error) {
      debug.validationError(validationResult.error.message, JSON.stringify(item))
    }

    return this.#generateDataItem(validationResult.value, resourceConfig)
  }

  /**
   * Called once per request, generally where a single object is to be created/updated
   *
   * @param {*} cItem
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @throws
   * @returns
   */
  static async enforceSchemaOnObject(cItem, resourceConfig) {
    debug.validationOutput(JSON.stringify(cItem))
    const item = await loadPromises(cItem, resourceConfig)
    this.#convertId(item, resourceConfig)
    const compiled = Joi.compile(Prop.getAllSchemas(resourceConfig))
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

    const dataItem = await this.#generateDataItem(validationResult.value, resourceConfig)
    return dataItem
  }

  /**
   *
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static #getDataItemInfo(resourceConfig) {
    const linkProperties = this.#getLinkProperties(resourceConfig)
    const attributeProperties = Object.keys(resourceConfig.attributes).filter(someProperty => {
      if (someProperty === 'id') return false
      if (someProperty === 'type') return false
      if (someProperty === 'meta') return false
      return !Relation.getRelation(resourceConfig, someProperty)
    })
    return { attributeProperties, linkProperties }
  }

  /**
   * Called once for every datum produced by a request
   *
   * @param {*} item
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static async #generateDataItem(item, resourceConfig) {
    const { attributeProperties, linkProperties } = responseHelper.#getDataItemInfo(resourceConfig)

    const attributes = Object.fromEntries(
      attributeProperties.filter(p => p in item).map(p => [p, item[p]]))

    return {
      type: item.type,
      id: '' + item.id,
      attributes,
      links: this.#generateLinks(item),
      relationships: await this.#generateRelationships(item, resourceConfig, linkProperties),
      meta: item.meta
    }
  }

  /**
   * Called once per applicable request
   *
   * @param {*[]} items
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @returns
   */
  static async *#generateDataItems(items, resourceConfig) {
    if(!items.length) {
      return
    }
    const { attributeProperties, linkProperties } = responseHelper.#getDataItemInfo(resourceConfig)

    for(const item of items) {
      const attributes = Object.fromEntries(
        attributeProperties.map(p => [p, item[p]]))
      yield {
        type: item.type,
        id: '' + item.id,
        attributes,
        links: this.#generateLinks(item),
        relationships: await this.#generateRelationships(item, resourceConfig, linkProperties),
        meta: item.meta
      }
    }
  }

  static #generateLinks(item) {
    return {
      self: `${this.#baseUrl + item.type}/${item.id}`
    }
  }

  /**
   * Called once for every datum produced by a request
   *
   * @param {*} item
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @param {*} linkProperties
   * @returns
   */
  static async #generateRelationships(item, resourceConfig, linkProperties) {
    if (linkProperties.length === 0) return undefined

    const links = { }

    for (const linkProperty of linkProperties) {
      links[linkProperty] = await this.#generateLink(item, resourceConfig, linkProperty)
    }

    return links
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
   * @param {*} linkProperty
   * @returns
   */
  static async #generateLink(item, resourceConfig, linkProperty) {
    const rel = Relation.getRelation(resourceConfig, linkProperty)
    const link = {
      meta: {
        relation: 'primary',
        // type: rel.resources,
        readOnly: false
      },
      links: {
        self: `${this.#baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
        related: `${this.#baseUrl + item.type}/${item.id}/${linkProperty}`
      },
      data: undefined
    }

    if (rel.count == "many" && item[linkProperty] !== undefined) {
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

    if (rel.count == "one") {
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

    if (rel instanceof RemoteRelation) {
      const relatedResource = rel.resources[0]
      // get information about the linkage - list of ids and types
      // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
      link.links.self = `${this.#baseUrl + relatedResource}/relationships/?${rel.remoteKey}=${item.id}`
      // get full details of all linked resources
      // /rest/bookings/?filter[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
      link.links.related = `${this.#baseUrl + relatedResource}/?filter[${rel.remoteKey}]=${item.id}`
      if (item[linkProperty]) {
        link.data = null
      } else {
        // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
        link.data = undefined
      }
      link.meta = {
        relation: 'foreign',
        belongsTo: relatedResource,
        as: rel.remoteKey,
        many: rel.count == "many",
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