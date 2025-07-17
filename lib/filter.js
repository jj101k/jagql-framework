'use strict'

const ourJoi = require("./ourJoi")

/**
 * @typedef {import("../types/Handler").FilterSpec} FilterSpec
 */

/**
 * Single-character field prefix
 */
const FILTER_OPERATORS = new Set(['<', '>', '~', ':'])
/**
 * Single-character field prefix
 */
const STRING_ONLY_OPERATORS = new Set(['~', ':'])
const FILTER_SEPARATOR = ','

module.exports = class filter {
  /**
   *
   * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
   * @param {string} key
   * @returns
   */
  static #resourceDoesNotHaveProperty(resourceConfig, key) {
    if (resourceConfig.attributes[key]) return null
    return {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Invalid filter',
      detail: `${resourceConfig.resource} do not have attribute or relationship '${key}'`
    }
  }

  /**
   *
   * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
   * @param {string} key
   * @returns
   */
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

  /**
   * Filter values starting with any of <>~: become an operator-value pair.
   * Otherwise it's the plain value.
   *
   * @param {string} element
   * @returns {FilterSpec}
   */
  static #splitElement(element) {
    if (!element) return null
    if (FILTER_OPERATORS.has(element[0])) {
      return { operator: element[0], value: element.substring(1) }
    }
    return { operator: null, value: element }
  }

  /**
   * Returns an error message if a string operation was requested but the
   * attribute is not defined as a string
   *
   * @param {string | null | undefined} operator
   * @param {import("joi").Schema | null | undefined} attributeConfig
   * @returns
   */
  static #stringOnlyOperator(operator, attributeConfig) {
    if (!operator || !attributeConfig) return null
    const desc = attributeConfig.describe()
    if (STRING_ONLY_OPERATORS.has(operator) && desc.type !== "string") {
      return `operator ${operator} can only be applied to string attributes`
    }
    return null
  }

  /**
   * If the filter definition looks valid, returns it; otherwise, returns an
   * error.
   *
   * @param {import("joi").Schema} attributeConfig
   * @param {string} scalarElement
   * @returns {{result: FilterSpec} | {error: string}}
   */
  static #parseFilterDef(attributeConfig, scalarElement) {
    if (!scalarElement) return { error: 'invalid or empty filter element' }

    const splitElement = this.#splitElement(scalarElement)
    if (!splitElement) return { error: 'empty filter' }

    const error = this.#stringOnlyOperator(splitElement.operator,
      attributeConfig)
    if (error) return { error }

    if (ourJoi.getSettings(attributeConfig)) { // relationship attribute: no further validation
      return { result: splitElement }
    }

    const validateResult = attributeConfig.validate(splitElement.value)
    if (validateResult.error) {
      return { error: validateResult.error.message }
    }

    return { result: { operator: splitElement.operator,
      value: validateResult.value } }
  }

  /**
   *
   * @param {import("joi").Schema} attributeConfig
   * @param {string[]} filterDefs
   * @returns {{result: FilterSpec[]} | {error: string[]}}
   */
  static #parseFilterDefsHelper(attributeConfig, filterDefs) {
    if (!filterDefs) return { error: 'invalid or empty filter element' }

    const parsedDefs = filterDefs.map(
      filterDef => this.#parseFilterDef(attributeConfig, filterDef))

    /**
     * @type {string[]}
     */
    const errors = []
    /**
     * @type {FilterSpec[]}
     */
    const results = []
    for(const def of parsedDefs) {
      if(def.error) {
        errors.push(def.error)
      } else {
        results.push(def.result)
      }
    }

    if (errors.length) return { error: errors }

    return { result: results }
  }

  /**
   *
   * @param {string} attributeName
   * @param {import("joi").Schema} attributeConfig
   * @param {string[]} filterDefs
   * @returns {{error: import("../types/Handler").JsonApiError} | {result: FilterSpec[]}}
   */
  static #parseFilterDefs(attributeName, attributeConfig, filterDefs) {
    const helperResult =
      this.#parseFilterDefsHelper(attributeConfig, filterDefs)

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

  /**
   *
   * @param {import("../types/Handler").JsonApiRequest} request
   * @returns {import("../types/Handler").JsonApiError | null}
   */
  static parseAndValidate(request) {
    if (!request.params.filter) return null

    const resourceConfig = request.resourceConfig

    /**
     * @type {Record<string, FilterSpec[]>}
     */
    const processedFilter = { }

    const filterReformatted = Object.fromEntries(
      Object.entries(request.params.filter).map(([key, filterElement]) => {
        if (typeof filterElement == "string") {
          filterElement = filterElement.split(FILTER_SEPARATOR)
        }
        return [key, filterElement]
      })
    )

    for (const [key, filterDefs] of Object.entries(filterReformatted)) {
      if (!Array.isArray(filterDefs) && filterDefs instanceof Object) continue // skip deep filters

      const error = this.#resourceDoesNotHaveProperty(resourceConfig, key) ??
        this.#relationshipIsForeign(resourceConfig, key)
      if (error) return error

      const parsedFilterElement = this.#parseFilterDefs(key,
          resourceConfig.attributes[key], filterDefs)
      if (parsedFilterElement.error) return parsedFilterElement.error

      processedFilter[key] = [...parsedFilterElement.result]
    }

    request.params.filter = filterReformatted // Compat only
    request.processedFilter = processedFilter

    return null
  }
}

