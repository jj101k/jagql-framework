'use strict'

const debug = require('../debugging.js')
const { JsonApiError } = require('../errorHandlers/JsonApiError.js')
const tools = require('../tools.js')

/**
 *
 */
module.exports = class filter {
  /**
   * @readonly
   * @type {Record<string, (value: any, filter: string) => boolean}
   */
  static #filterFunctions = {
    ">": (attrValue, filterValue) => attrValue > filterValue,
    "<": (attrValue, filterValue) => attrValue < filterValue,
    "~": (attrValue, filterValue) => attrValue.toLowerCase() === filterValue.toLowerCase(),
    ":": (attrValue, filterValue) => attrValue.toLowerCase().includes(filterValue.toLowerCase())
  }
  /**
   *
   * @param {import('../../types/JsonApiRequest.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @returns
   */
  static action(request, response) {
    const filters = request.processedFilter
    if (!filters) return

    if(response.meta?.page) {
      // We cannot have a meaningful total, nor pagination, if we're doing
      // after-the-fact filtering. So strip the metadata for that.
      delete response.meta.page
    }

    if (Array.isArray(response.data)) {
      /**
       * @type {typeof response.data}
       */
      const retainedData = []
      for (const datum of response.data) {
        if (this.#filterKeepObject(datum, filters)) {
          retainedData.push(datum)
        } else {
          debug.filter('removed', JSON.stringify(filters), JSON.stringify(datum.attributes))
        }
      }
      response.data = retainedData
    } else if (response.data instanceof Object) {
      if (!this.#filterKeepObject(response.data, filters)) {
        debug.filter('removed', JSON.stringify(filters), JSON.stringify(response.data.attributes))
        throw new JsonApiError({
          status: 404,
          code: 'ENOTFOUND',
          title: 'Requested resource does not exist',
          detail: `There is no ${request.routeParams.type} with id ${request.routeParams.id} which satisfies ${request.query.filter}`
        })
      }
    }
  }

  /**
   *
   * @param {*} a
   * @param {*} b
   * @returns
   */
  static #isEqual(a, b) {
    if(Array.isArray(a) != Array.isArray(b)) {
      return false
    }
    if((typeof a) != (typeof b)) {
      return false
    }
    if(Array.isArray(a)) {
      return a.length == b.length && a.every((_, i) => this.#isEqual(a[i], b[i]))
    } else if(typeof a == "object") {
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)
      if(aKeys.length != bKeys.length) {
        return false
      }
      return aKeys.every(k => this.#isEqual(a[k], b[k]))
    } else {
      return a === b
    }
  }

  /**
   *
   * @param {import('../../types/Filter.js').FilterSpec} filterElement
   * @param {*} attributeValue
   * @returns
   */
  static #filterMatches(filterElement, attributeValue) {
    if (!filterElement.operator) {
      return this.#isEqual(attributeValue, filterElement.value)
    }
    return this.#filterFunctions[filterElement.operator](attributeValue,
      filterElement.value)
  }

  /**
   *
   * @param {import('../../types/JsonApiResponse.js').JsonApiPrimaryDataSingle} someObject
   * @param {Record<string, import('../../types/Filter.js').FilterSpec[]>} filters
   * @returns
   */
  static #filterKeepObject(someObject, filters) {
    for (const [prop, allowList] of Object.entries(filters)) {
      const allowListSimple = new Set(allowList.filter(a => !a.operator).map(a => a.value))
      if (prop in someObject.relationships) {
        if(!this.#relationshipMatchesOR(someObject.relationships[prop], allowListSimple)) {
          return false
        }
        continue
      }

      const allowListComplex = allowList.filter(a => a.operator)
      if (prop == "id") {
        if(!this.#attributesMatchesOR(someObject.id, allowListSimple, allowListComplex)) {
          return false
        }
      } else if (prop in someObject.attributes) {
        if(!this.#attributesMatchesOR(someObject.attributes[prop], allowListSimple, allowListComplex)) {
          return false
        }
      } else {
        // It doesn't exist at all
        return false
      }
    }
    return true
  }

  /**
   * Returns true if the value matches any of the conditions
   *
   * @param {*} attributeValue
   * @param {Set<string>} allowListSimple
   * @param {import('../../types/Filter.js').FilterSpec[]} allowListComplex
   * @returns
   */
  static #attributesMatchesOR(attributeValue, allowListSimple, allowListComplex) {
    if(allowListSimple.has(attributeValue)) {
      return true
    }
    return allowListComplex.some(filterElement => this.#filterMatches(filterElement, attributeValue))
  }

  /**
   * Returns true if the relationship matches any of the supplied IDs
   *
   * @param {import('../../types/JsonApiResponse.js').JsonApiRelationshipObject} relationships
   * @param {Set<string>} allowListSimple
   * @returns
   */
  static #relationshipMatchesOR(relationships, allowListSimple) {
    const relOrRels = relationships.data

    const rels = tools.ensureArrayNotNullish(relOrRels)

    const relIds = rels.map(relationship => relationship.id)

    return relIds.some(id => allowListSimple.has(id))
  }
}