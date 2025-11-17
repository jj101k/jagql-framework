"use strict"
const pagination = require("./pagination.js")
const Joi = require("joi")
const debug = require("./debugging.js")
const tools = require("./tools.js")
const Relationship = require("./Relationship.js")
const RemoteRelationship = require("./RemoteRelationship.js")
const Prop = require("./Prop.js")
const { JsonApiError } = require("./errorHandlers/JsonApiError.js")
const DataItemInfo = require("./DataItemInfo.js")

/**
 * @typedef {import("../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
module.exports = class responseHelper {
  /**
   * @type {string} The base URL, strictly for the advisory links in the response.
   */
  static #baseUrl
  /**
   * @type {*}
   */
  static #metadata

  /**
   * Called 1-2 times for every datum produced by a request
   *
   * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
   * @returns
   */
  static #getLinkProperties(resourceConfig) {
    return Relationship.getAllRelationships(resourceConfig).map(([k]) => k)
  }

  /**
   * Called once per validated object
   *
   * @param {*} item
   * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
   */
  static convertId(item, resourceConfig) {
    if (item.id) {
      item.id = "" + item.id
    }
    for(const p of this.#getLinkProperties(resourceConfig)) {
      const v = item[p]
      if(!v) continue
      if(Array.isArray(v)) {
        item[p] = v.map(vi => ({id: "" + vi.id, type: vi.type, meta: vi.meta}))
      } else {
        item[p] = {id: "" + v.id, type: v.type, meta: v.meta}
      }
    }
  }

  /**
   * Set the base URL, strictly for the advisory links in the
   * response.
   *
   * @param {string} baseUrl
   */
  static setBaseUrl(baseUrl) {
    this.#baseUrl = baseUrl
  }

  /**
   *
   * @param {*} meta
   */
  static setMetadata(meta) {
    this.#metadata = meta
  }

  /**
   * Routinely called at the end of single-object requests
   *
   * @param {*} cItem
   * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
   * @param {string | null} inferredBaseUrl
   * @returns
   */
  static async checkSchemaOnObject(cItem, resourceConfig, inferredBaseUrl) {
    const baseUrl = inferredBaseUrl ?? this.#baseUrl
    debug.validationOutput(JSON.stringify(cItem))
    const item = await tools.loadPromises(cItem, resourceConfig)
    this.convertId(item, resourceConfig)
    const compiledSchema = Joi.compile(Prop.getAllSchemas(resourceConfig))
    const dataItemInfo = new DataItemInfo(resourceConfig)
    const validationResult = compiledSchema.validate(item)
    if (validationResult.error) {
      debug.validationError(validationResult.error.message, JSON.stringify(item))
    }

    return this.#generateDataItem(validationResult.value, dataItemInfo, baseUrl)
  }

  /**
   * Called once per request, generally where a single object is to be created/updated
   *
   * @param {*} cItem
   * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
   * @param {string | null} inferredBaseUrl
   * @throws
   * @returns
   */
  static async enforceSchemaOnObject(cItem, resourceConfig, inferredBaseUrl) {
    const baseUrl = inferredBaseUrl ?? this.#baseUrl
    debug.validationOutput(JSON.stringify(cItem))
    const item = await tools.loadPromises(cItem, resourceConfig)
    this.convertId(item, resourceConfig)
    const compiled = Joi.compile(Prop.getAllSchemas(resourceConfig))
    const dataItemInfo = new DataItemInfo(resourceConfig)
    const validationResult = compiled.validate(item)
    if (validationResult.error) {
      debug.validationError(validationResult.error.message, JSON.stringify(item))
      throw new JsonApiError({
        status: 500,
        code: "EINVALIDITEM",
        title: "Item in response does not validate",
        detail: validationResult.error.message,
        meta: {
          item: item,
          error: validationResult.error.message
        }
      })
    }

    return this.#generateDataItem(validationResult.value, dataItemInfo, baseUrl)
  }

  /**
   * Called once for every datum produced by a request
   *
   * @param {*} item
   * @param {DataItemInfo} dataItemInfo
   * @param {string} baseUrl
   * @returns
   */
  static async #generateDataItem(item, dataItemInfo, baseUrl) {
    const { attributeProperties, linkProperties, relationships: relationshipsIn } = dataItemInfo

    const attributes = Object.fromEntries(
      attributeProperties.filter(p => p in item).map(p => [p, item[p]]))

    const relationships = this.#generateRelationships(item, relationshipsIn, linkProperties, baseUrl)

    return {
      type: item.type,
      id: "" + item.id,
      attributes,
      links: this.#generateLinks(item, baseUrl),
      relationships: tools.isPromise(relationships) ? await relationships : relationships,
      meta: item.meta
    }
  }

  /**
   * Called once per applicable request
   *
   * @template {{id: string, type: string, meta?: *}} R
   * @param {R[]} items
   * @param {DataItemInfo} dataItemInfo
   * @param {string | null} baseUrl
   * @returns {import("../types/JsonApiResponse.js").JsonApiResourceObject[] | Promise<import("../types/JsonApiResponse.js").JsonApiResourceObject[]>}
   */
  static generateDataItems(items, dataItemInfo, baseUrl) {
    if(!items.length) {
      return []
    }
    const { attributeProperties, linkProperties, relationships: relationshipsIn } = dataItemInfo

    /**
     * @type {import("../types/JsonApiResponse.js").JsonApiResourceObject[]}
     */
    const results = []
    const promises = []
    for(const item of items) {
      const attributes = Object.fromEntries(
        attributeProperties.map(p => [p, item[p]]))
      const relationships = this.#generateRelationships(item, relationshipsIn, linkProperties, baseUrl)
      const result = {
        type: item.type,
        id: "" + item.id,
        attributes,
        links: this.#generateLinks(item, baseUrl),
        relationships: {},
        meta: item.meta
      }

      if(tools.isPromise(relationships)) {
        promises.push(relationships.then(r => result.relationships = r))
      } else {
        result.relationships = relationships
      }

      results.push(result)
    }

    if(promises.length) {
      return Promise.all(promises).then(() => results)
    }

    return results
  }

  /**
   * @template {{id: string, type: string, meta?: *}} R
   * @param {R} item
   * @param {string} baseUrl
   * @returns
   */
  static #generateLinks(item, baseUrl) {
    return {
      self: `${baseUrl + item.type}/${item.id}`
    }
  }

  /**
   * Called once for every datum produced by a request
   *
   * @template {{id: string, type: string, meta?: *}} R
   * @param {R} item
   * @param {Record<string, import("./BaseRelationship.js")>} relationshipsIn
   * @param {*} linkProperties
   * @param {string} baseUrl
   * @returns
   */
  static #generateRelationships(item, relationshipsIn, linkProperties, baseUrl) {
    if (linkProperties.length === 0) return undefined

    /**
     * @type {Record<string, import("../types/JsonApiResponse.js").JsonApiLink>}
     */
    const links = { }

    const promises = []
    for (const linkProperty of linkProperties) {
      const rel = relationshipsIn[linkProperty]
      const l = this.#generateLink(item, rel, linkProperty, baseUrl)
      if(tools.isPromise(l)) {
        promises.push(l.then(a => links[linkProperty] = a))
      } else {
        links[linkProperty] = l
      }
    }

    if(promises.length) {
      return Promise.all(promises).then(() => links)
    }

    return links
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {*} linkProperty
   * @param {RemoteRelationship} rel
   * @param {string} baseUrl
   * @returns {Promise<import("../types/JsonApiResponse.js").JsonApiLink>}
   */
  static async #generateLinkRemote(item, linkProperty, rel, baseUrl) {
    const relatedResource = rel.resources[0]
    return {
      meta: {
        relation: "foreign",
        belongsTo: relatedResource,
        as: rel.remoteKey,
        many: rel.count == "many",
        readOnly: true
      },
      links: {
        // get information about the linkage - list of ids and types
        // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
        self: `${baseUrl + relatedResource}/relationships/?${rel.remoteKey}=${item.id}`,
        // get full details of all linked resources
        // /rest/bookings/?filter[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
        related: `${baseUrl + relatedResource}/?filter[${rel.remoteKey}]=${item.id}`
      },
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      data: item[linkProperty] ? null : undefined
    }
  }


  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {*} linkProperty
   * @param {*} linkItem
   * @param {string} baseUrl
   * @returns
   */
  static async #generateLinkOneInner(item, linkProperty, linkItem, baseUrl) {
    return {
      meta: {
        /**
         * @type {"primary"}
         */
        relation: "primary",
        // type: rel.resources,
        readOnly: false
      },
      links: {
        self: `${baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
        related: `${baseUrl + item.type}/${item.id}/${linkProperty}`
      },
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      data: linkItem ? {
        type: linkItem.type,
        id: "" + linkItem.id,
        meta: linkItem.meta
      } : null
    }
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {*} linkProperty
   * @param {string} baseUrl
   * @returns
   */
  static async #generateLinkOne(item, linkProperty, baseUrl) {
    if(tools.isPromise(item[linkProperty])) {
      return item[linkProperty].then(linkItem => this.#generateLinkOneInner(item, linkProperty, linkItem, baseUrl))
    } else {
      return this.#generateLinkOneInner(item, linkProperty, item[linkProperty], baseUrl)
    }
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {*} linkProperty
   * @param {*} linkItemOrItems
   * @param {string} baseUrl
   * @returns {Promise<import("../types/JsonApiResponse.js").JsonApiLink>}
   */
  static async #generateLinkManyInner(item, linkProperty, linkItemOrItems, baseUrl) {
    return {
      meta: {
        relation: "primary",
        // type: rel.resources,
        readOnly: false
      },
      links: {
        self: `${baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
        related: `${baseUrl + item.type}/${item.id}/${linkProperty}`
      },
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      data: linkItemOrItems ?
        tools.ensureArrayNotNullish(linkItemOrItems).map(linkItem => ({
        type: linkItem.type,
        id: "" + linkItem.id,
        meta: linkItem.meta
      })) : [],
    }
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {*} linkProperty
   * @param {string} baseUrl
   * @returns {Promise<import("../types/JsonApiResponse.js").JsonApiLink>}
   */
  static async #generateLinkMany(item, linkProperty, baseUrl) {
    if(tools.isPromise(item[linkProperty])) {
      return item[linkProperty].then(linkItemOrItems => this.#generateLinkManyInner(item, linkProperty, linkItemOrItems, baseUrl))
    } else {
      return this.#generateLinkManyInner(item, linkProperty, item[linkProperty], baseUrl)
    }
  }

  /**
   * Called once for every datum-relationship generated in a request
   *
   * @param {*} item
   * @param {import("./BaseRelationship.js")} rel
   * @param {*} linkProperty
   * @param {string} baseUrl
   * @returns {import("../types/JsonApiResponse.js").JsonApiLink | Promise<import("../types/JsonApiResponse.js").JsonApiLink>}
   */
  static #generateLink(item, rel, linkProperty, baseUrl) {
    if (RemoteRelationship.isRemoteRelationship(rel)) {
      return this.#generateLinkRemote(item, linkProperty, rel, baseUrl)
    }

    if (rel.count == "one") {
      return this.#generateLinkOne(item, linkProperty, baseUrl)
    }

    if (rel.count == "many" && item[linkProperty] !== undefined) {
      return this.#generateLinkMany(item, linkProperty, baseUrl)
    }

    return {
      meta: {
        relation: "primary",
        // type: rel.resources,
        readOnly: false
      },
      links: {
        self: `${baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
        related: `${baseUrl + item.type}/${item.id}/${linkProperty}`
      },
      data: undefined
    }
  }

  /**
   *
   * @param {import("../types/JsonApiResponse.js").JsonApiResponseError} error
   */
  static #sanitiseError(error) {
    /**
     *
     * @param {string | undefined} v
     * @returns
     */
    const _string = (v) => v ? "" + v : v
    /**
     *
     * @param {object | undefined} v
     * @param {(v: any) => any} f
     * @returns
     */
    const _object = (v, f) => v ? Object.fromEntries(Object.entries(v).map(([k, v]) => [k, f(v)])) : undefined
    /**
     *
     * @param {*} v
     * @returns {import("../types/JsonApiResponse.js").JsonApiLinkObject |
     * string | null}
     */
    const _linkObject = (v) => {
      if(v === null) {
        return v
      } else if(typeof v == "string") {
        return v
      } else {
        return {
          href: "" + v.href,
          describedBy: _linkObject(v.describedBy),
          title: _string(v.title),
          type: _string(v.type),
          hreflang: Array.isArray(v.hreflang) ? v.hreflang.map(l => _string(l)) : _string(v.hreflang),
          meta: v.meta,
        }
      }
    }
    return {
      id: _string(error.id),
      links: _object(error.links, _linkObject),
      status: _string(error.status),
      code: _string(error.code),
      title: _string(error.title),
      detail: _string(error.detail),
      source: _object(error.source, v => "" + v),
      meta: error.meta,
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {JsonApiError | JsonApiError[] | unknown} errOrErrs
   * @returns {import("../types/JsonApiResponse.js").JsonApiResponseBodyErrorWithMeta}
   */
  static generateError(request, errOrErrs) {
    const baseUrl = request.inferredBaseUrl ?? this.#baseUrl
    debug.errors(request.route.verb, request.route.combined, JSON.stringify(errOrErrs))
    const errors = tools.ensureArray(errOrErrs)

    return {
      jsonapi: {
        version: "1.0"
      },
      meta: this.generateMeta(request),
      links: {
        self: baseUrl + request.route.path
      },
      errors: errors.map(e => this.#sanitiseError(("toJSON" in e) ? e.toJSON() : e)),
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {*} resourceConfig
   * @param {*} sanitisedData
   * @param {*} handlerTotal
   * @returns {import("../types/JsonApiResponse.js").JsonApiResponseBodyWithMeta}
   */
  static generateResponse(request, resourceConfig, sanitisedData, handlerTotal) {
    const baseUrl = request.inferredBaseUrl ?? this.#baseUrl
    return {
      jsonapi: {
        version: "1.0"
      },

      meta: this.generateMeta(request, handlerTotal),

      links: {
        self: baseUrl + request.route.path + (request.route.query ? ("?" + request.route.query) : ""),
        ...pagination.generatePageLinks(request, handlerTotal),
      },

      data: sanitisedData
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @returns
   */
  static #getMetadata(request) {
    if (typeof this.#metadata === "function") {
      return this.#metadata(request)
    } else {
      return {...this.#metadata}
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {number} [handlerTotal]
   * @returns
   */
  static generateMeta(request, handlerTotal) {
    const meta = this.#getMetadata(request)

    if (handlerTotal) {
      meta.page = pagination.generateMetaSummary(request, handlerTotal)
    }

    return meta
  }
}