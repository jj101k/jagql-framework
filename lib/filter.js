'use strict'

const ourJoi = require("./ourJoi")

const FILTER_OPERATORS = ['<', '>', '~', ':']
const STRING_ONLY_OPERATORS = ['~', ':']
const FILTER_SEPERATOR = ','

module.exports = class filter {
  static #resourceDoesNotHaveProperty(resourceConfig, key) {
    if (resourceConfig.attributes[key]) return null
    return {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Invalid filter',
      detail: `${resourceConfig.resource} do not have attribute or relationship '${key}'`
    }
  }

  static #relationshipIsForeign(resourceConfig, key) {
    const relationSettings = ourJoi.getSettings(resourceConfig.attributes[key])
    if (!relationSettings || !relationSettings.__as) return null
    return {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Invalid filter',
      detail: `Filter relationship '${key}' is a foreign reference and does not exist on ${resourceConfig.resource}`
    }
  }

  static #splitElement(element) {
    if (!element) return null
    if (FILTER_OPERATORS.indexOf(element[0]) !== -1) {
      return { operator: element[0], value: element.substring(1) }
    }
    return { operator: null, value: element }
  }

  /**
   *
   * @param {string | null | undefined} operator
   * @param {import("joi").Schema | null | undefined} attributeConfig
   * @returns
   */
  static #stringOnlyOperator(operator, attributeConfig) {
    if (!operator || !attributeConfig) return null
    const desc = attributeConfig.describe()
    if (STRING_ONLY_OPERATORS.indexOf(operator) !== -1 && desc.type !== 'string') {
      return `operator ${operator} can only be applied to string attributes`
    }
    return null
  }

  static #parseScalarFilterElement(attributeConfig, scalarElement) {
    if (!scalarElement) return { error: 'invalid or empty filter element' }

    const splitElement = this.#splitElement(scalarElement)
    if (!splitElement) return { error: 'empty filter' }

    const error = this.#stringOnlyOperator(splitElement.operator, attributeConfig)
    if (error) return { error }

    if (ourJoi.getSettings(attributeConfig)) { // relationship attribute: no further validation
      return { result: splitElement }
    }

    const validateResult = attributeConfig.validate(splitElement.value)
    if (validateResult.error) {
      return { error: validateResult.error.message }
    }

    const validatedElement = { operator: splitElement.operator, value: validateResult.value }
    return { result: validatedElement }
  }

  static #parseFilterElementHelper(attributeConfig, filterElement) {
    if (!filterElement) return { error: 'invalid or empty filter element' }

    const parsedElements = [].concat(filterElement).map(scalarElement => this.#parseScalarFilterElement(attributeConfig, scalarElement))

    if (parsedElements.length === 1) return parsedElements[0]

    const errors = parsedElements.reduce((combined, element) => {
      if (!combined) {
        if (!element.error) return combined
        return [ element.error ]
      }
      return combined.concat(element.error)
    }, null)

    if (errors) return { error: errors }

    const results = parsedElements.map(element => element.result)

    return { result: results }
  }

  static #parseFilterElement(attributeName, attributeConfig, filterElement) {
    const helperResult = this.#parseFilterElementHelper(attributeConfig, filterElement)

    if (helperResult.error) {
      return {
        error: {
          status: '403',
          code: 'EFORBIDDEN',
          title: 'Invalid filter',
          detail: `Filter value for key '${attributeName}' is invalid: ${helperResult.error}`
        }
      }
    }
    return { result: helperResult.result }
  }

  static parseAndValidate(request) {
    if (!request.params.filter) return null

    const resourceConfig = request.resourceConfig

    const processedFilter = { }
    let error
    let filterElement
    let parsedFilterElement

    for (const key in request.params.filter) {
      filterElement = request.params.filter[key]

      if (typeof filterElement === 'string') request.params.filter[key] = filterElement = filterElement.split(FILTER_SEPERATOR)

      if (!Array.isArray(filterElement) && filterElement instanceof Object) continue // skip deep filters

      error = this.#resourceDoesNotHaveProperty(resourceConfig, key)
      if (error) return error

      error = this.#relationshipIsForeign(resourceConfig, key)
      if (error) return error

      parsedFilterElement = this.#parseFilterElement(key, resourceConfig.attributes[key], filterElement)
      if (parsedFilterElement.error) return parsedFilterElement.error

      processedFilter[key] = [].concat(parsedFilterElement.result)
    }

    request.processedFilter = processedFilter

    return null
  }
}

