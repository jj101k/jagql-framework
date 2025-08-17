'use strict'

const { JsonApiError } = require('../errorHandlers/JsonApiError.js')
const Prop = require('../Prop.js')

/**
 *
 */
module.exports = class sort {
  /**
   *
   * @param {string} sortSpecRendered
   * @returns
   */
  static #parseSortSpec(sortSpecRendered) {
    if (sortSpecRendered.startsWith("-")) {
      return {ascending: -1, attribute: sortSpecRendered.substring(1)}
    } else {
      return {ascending: 1, attribute: sortSpecRendered}
    }
  }
  /**
   *
   * @param {import('../../types/JsonApiRequest.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @returns
   */
  static action(request, response) {
    if (!request.params.sort) return
    const {ascending, attribute} = this.#parseSortSpec(request.params.sort)

    if (!Prop.hasProperty(request.resourceConfig, attribute)) {
      throw new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Invalid sort',
        detail: `${request.resourceConfig.resource} do not have property ${attribute}`
      })
    }

    response.data.sort((a, b) => {
      if (typeof a.attributes[attribute] === 'string') {
        return a.attributes[attribute].localeCompare(b.attributes[attribute]) * ascending
      } else if (typeof a.attributes[attribute] === 'number' || a.attributes[attribute] instanceof Date) {
        return (a.attributes[attribute] - b.attributes[attribute]) * ascending
      } else {
        return 0
      }
    })
  }
}