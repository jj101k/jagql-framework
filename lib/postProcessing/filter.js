'use strict'

const debug = require('../debugging.js')
const tools = require('../tools.js')

module.exports = class filter {
  /**
   *
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @param {() => any} callback
   * @returns
   */
  static action(request, response, callback) {
    const filters = request.processedFilter
    if (!filters) return callback()

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
        return callback({ // eslint-disable-line standard/no-callback-literal
          status: '404',
          code: 'ENOTFOUND',
          title: 'Requested resource does not exist',
          detail: `There is no ${request.params.type} with id ${request.params.id} which satisfies ${request.params.filter}`
        })
      }
    }

    return callback()
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
   * @param {import('../../types/Handler.js').FilterSpec} filterElement
   * @param {*} attributeValue
   * @returns
   */
  static #filterMatches(filterElement, attributeValue) {
    if (!filterElement.operator) {
      return this.#isEqual(attributeValue, filterElement.value)
    }
    /**
     * @type {Record<string, (value: any, filter: string) => boolean}
     */
    const filterFunctions = {
      '>': (attrValue, filterValue) => attrValue > filterValue,
      '<': (attrValue, filterValue) => attrValue < filterValue,
      '~': (attrValue, filterValue) => attrValue.toLowerCase() === filterValue.toLowerCase(),
      ':': (attrValue, filterValue) => attrValue.toLowerCase().includes(filterValue.toLowerCase())
    }
    const result = filterFunctions[filterElement.operator](attributeValue,
      filterElement.value)
    return result
  }

  /**
   *
   * @param {import('../../types/JsonApiResponse.js').JsonApiPrimaryDataSingle} someObject
   * @param {Record<string, import('../../types/Handler.js').FilterSpec[]>} filters
   * @returns
   */
  static #filterKeepObject(someObject, filters) {
    for (const [prop, allowList] of Object.entries(filters)) {
      const allowListSimple = new Set(allowList.filter(a => !a.operator).map(a => a.value))
      const allowListComplex = allowList.filter(a => a.operator)
      if (prop == "id") {
        if(!this.#attributesMatchesOR(someObject.id, allowListSimple, allowListComplex)) {
          return false
        }
      } else if (prop in someObject.attributes) {
        const attributeValue = someObject.attributes[prop]
        if(!this.#attributesMatchesOR(attributeValue, allowListSimple, allowListComplex)) {
          return false
        }
      } else if (prop in someObject.relationships) {
        const relationships = someObject.relationships[prop]
        if(!this.#relationshipMatchesOR(relationships, allowListSimple)) {
          return false
        }
      } else {
        return false
      }
    }
    return true
  }

  /**
   *
   * @param {any} attributeValue
   * @param {Set<string>} allowListSimple
   * @param {import('../../types/Handler.js').FilterSpec[]} allowListComplex
   * @returns
   */
  static #attributesMatchesOR(attributeValue, allowListSimple, allowListComplex) {
    if(allowListSimple.has(attributeValue)) {
      return true
    }
    for(const filterElement of allowListComplex) {
      if (this.#filterMatches(filterElement, attributeValue)) {
        return true
      }
    }
    return false
  }

  /**
   *
   * @param {import('../../types/JsonApiResponse.js').JsonApiRelationshipObject} relationships
   * @param {Set<string>} allowListSimple
   * @returns
   */
  static #relationshipMatchesOR(relationships, allowListSimple) {
    const relOrRels = relationships.data

    const rels = tools.ensureArrayNotNullish(relOrRels)

    const relIds = rels.map(relation => relation.id)

    return relIds.some(id => allowListSimple.has(id))
  }
}