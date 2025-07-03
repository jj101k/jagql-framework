'use strict'

const _ = {
  assign: require('lodash.assign'),
  isEqual: require('lodash.isequal')
}
const debug = require('../debugging.js')

module.exports = class filter {
  static action(request, response, callback) {
    const filters = request.processedFilter
    if (!filters) return callback()

    if (Array.isArray(response.data)) {
      for (let j = 0; j < response.data.length; j++) {
        if (!this.#filterKeepObject(response.data[j], filters)) {
          debug.filter('removed', JSON.stringify(filters), JSON.stringify(response.data[j].attributes))
          response.data.splice(j, 1)
          j--
        }
      }
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

  static #filterMatches(filterElement, attributeValue) {
    if (!filterElement.operator) {
      return _.isEqual(attributeValue, filterElement.value)
    }
    const filterFunction = {
      '>': function filterGreaterThan (attrValue, filterValue) {
        return attrValue > filterValue
      },
      '<': function filterLessThan (attrValue, filterValue) {
        return attrValue < filterValue
      },
      '~': function filterCaseInsensitiveEqual (attrValue, filterValue) {
        return attrValue.toLowerCase() === filterValue.toLowerCase()
      },
      ':': function filterCaseInsensitiveContains (attrValue, filterValue) {
        return attrValue.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1
      }
    }[filterElement.operator]
    const result = filterFunction(attributeValue, filterElement.value)
    return result
  }

  static #filterKeepObject(someObject, filters) {
    for (const filterName in filters) {
      const whitelist = filters[filterName]

      if (someObject.attributes.hasOwnProperty(filterName) || (filterName === 'id')) {
        let attributeValue = someObject.attributes[filterName]
        if (filterName === 'id') attributeValue = someObject.id
        const attributeMatches = this.#attributesMatchesOR(attributeValue, whitelist)
        if (!attributeMatches) return false
      } else if (someObject.relationships.hasOwnProperty(filterName)) {
        const relationships = someObject.relationships[filterName]
        const relationshipMatches = this.#relationshipMatchesOR(relationships, whitelist)
        if (!relationshipMatches) return false
      } else {
        return false
      }
    }
    return true
  }

  static #attributesMatchesOR(attributeValue, whitelist) {
    let matchOR = false
    whitelist.forEach(filterElement => {
      if (this.#filterMatches(filterElement, attributeValue)) {
        matchOR = true
      }
    })
    return matchOR
  }

  static #relationshipMatchesOR(relationships, whitelist) {
    let matchOR = false

    let data = relationships.data
    if (!data) return false

    if (!(Array.isArray(data))) data = [ data ]
    data = data.map(relation => relation.id)

    whitelist.forEach(filterElement => {
      if (data.indexOf(filterElement.value) !== -1) {
        matchOR = true
      }
    })
    return matchOR
  }
}