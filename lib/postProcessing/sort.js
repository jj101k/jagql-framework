'use strict'

const Relation = require('../Relation.js')

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
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @param {() => any} callback
   * @returns
   */
  static action(request, response, callback) {
    if (!request.params.sort) return callback()
    const {ascending, attribute} = this.#parseSortSpec(request.params.sort)

    if (!Relation.hasProperty(request.resourceConfig, attribute)) {
      return callback({ // eslint-disable-line standard/no-callback-literal
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid sort',
        detail: `${request.resourceConfig.resource} do not have property ${attribute}`
      })
    }

    // todo: consider using a stable sort algerith (e.g. lodash.sortBy)
    response.data = response.data.sort((a, b) => {
      if (typeof a.attributes[attribute] === 'string') {
        return a.attributes[attribute].localeCompare(b.attributes[attribute]) * ascending
      } else if (typeof a.attributes[attribute] === 'number' || a.attributes[attribute] instanceof Date) {
        return (a.attributes[attribute] - b.attributes[attribute]) * ascending
      } else {
        return 0
      }
    })

    return callback()
  }
}