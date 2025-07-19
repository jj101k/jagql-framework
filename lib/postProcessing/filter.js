'use strict'

const _ = {
  assign: require('lodash.assign'),
  isEqual: require('lodash.isequal')
}
const debug = require('../debugging.js')

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
   * @param {import('../../types/Handler.js').FilterSpec} filterElement
   * @param {*} attributeValue
   * @returns
   */
  static #filterMatches(filterElement, attributeValue) {
    if (!filterElement.operator) {
      return _.isEqual(attributeValue, filterElement.value)
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
    for (const [filterName, whitelist] of Object.entries(filters)) {
      if (filterName === 'id') {
        const attributeValue = someObject.id
        const attributeMatches =
          this.#attributesMatchesOR(attributeValue, whitelist)
        if (!attributeMatches) return false
      } else if (someObject.attributes.hasOwnProperty(filterName)) {
        const attributeValue = someObject.attributes[filterName]
        const attributeMatches =
          this.#attributesMatchesOR(attributeValue, whitelist)
        if (!attributeMatches) return false
      } else if (someObject.relationships.hasOwnProperty(filterName)) {
        const relationships = someObject.relationships[filterName]
        const relationshipMatches =
          this.#relationshipMatchesOR(relationships, whitelist)
        if (!relationshipMatches) return false
      } else {
        return false
      }
    }
    return true
  }

  /**
   *
   * @param {any} attributeValue
   * @param {import('../../types/Handler.js').FilterSpec[]} whitelist
   * @returns
   */
  static #attributesMatchesOR(attributeValue, whitelist) {
    for(const filterElement of whitelist) {
      if (this.#filterMatches(filterElement, attributeValue)) {
        return true
      }
    }
    return false
  }

  /**
   *
   * @param {import('../../types/JsonApiResponse.js').JsonApiRelationshipObject} relationships
   * @param {import('../../types/Handler.js').FilterSpec[]} whitelist
   * @returns
   */
  static #relationshipMatchesOR(relationships, whitelist) {
    const rels = relationships.data
    if (!rels) return false

    const relsMulti = Array.isArray(rels) ? rels : [rels]

    const relIds = relsMulti.map(relation => relation.id)

    for(const filterElement of whitelist) {
      if (relIds.includes(filterElement.value)) {
        return true
      }
    }

    return false
  }
}