'use strict'
const tools = require('../tools.js')
const jsonApiResources = require('../jsonApiResources.js')
const Relationship = require('../Relationship.js')
const { JsonApiError } = require('../errorHandlers/JsonApiError.js')
const { IncludeTreeNode } = require('./IncludeTreeNode.js')

/**
 * @typedef {import('../../types/JsonApiRequest.js').JsonApiRequest} JsonApiRequest
 * @typedef {import('../../types/JsonApiResponse.js').JsonApiError} JsonApiError
 */

/**
 *
 */
module.exports = class includePP {
  /**
   * Called once per request during post-processing
   *
   * @param {JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @returns
   */
  static async action(request, response) {
    const filters = request.query.filter
    const includeIn = request.query.include
    if (!includeIn) return
    const includes = (`${includeIn}`).split(',')

    const includeTree = this.#arrayToTree(request, includes, filters)

    const dataItems = tools.ensureArrayNotNullish(response.data)
    includeTree.clearDataItems()
    includeTree.addDataItems(...dataItems)

    await includeTree.initialise(request)

    includeTree.clearDataItems()
    response.included = includeTree.included
    /**
     * @type {Set<string>}
     */
    const seen = new Set()
    response.included = response.included.filter(someItem => {
      const k = `${someItem.type}~~${someItem.id}`
      if(seen.has(k)) {
        return false
      } else {
        seen.add(k)
        return true
      }
    })
  }

  /**
   * Called once per request during post-processing
   *
   * @param {JsonApiRequest} request
   * @param {string[]} includes
   * @param {import('../../types/Filter.js').FilterSpecByAttrIn | undefined} filters
   * @returns
   */
  static #arrayToTree(request, includes, filters) {
    /**
     * @type {JsonApiError[]}
     */
    const validationErrors = [ ]

    const tree = new IncludeTreeNode(request.resourceConfig)

    for(const include of includes) {
      this.#iterate(include, tree, filters, validationErrors)
    }

    if (validationErrors.length > 0) throw validationErrors
    return tree
  }

  /**
   * Called once per include during post-processing
   *
   * @param {string} text
   * @param {IncludeTreeNode} includeTree
   * @param {import('../../types/Filter.js').FilterSpecByAttrIn | undefined} filter
   * @param {JsonApiError[]} validationErrors
   * @returns
   */
  static #iterate(text, includeTree, filter, validationErrors) {
    if (text.length === 0) return null
    const parts = text.split('.')
    const relationship = parts.shift()
    const rest = parts.join('.')
    if (!filter) filter = {}

    const activeResourceConfig = includeTree.firstResourceWithRelationship(relationship)
    if (!activeResourceConfig) {
      return validationErrors.push(new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${includeTree.resourceTypes.join(" | ")} do not have property ${relationship}`
      }))
    }
    const rel = Relationship.getRelationship(activeResourceConfig, relationship)

    if (!rel) {
      return validationErrors.push(new JsonApiError({
        status: 403,
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${activeResourceConfig.resource}.${relationship} is not a relationship and cannot be included`
      }))
    }
    const resourceAttribute = rel.resources

    /**
     * @type {import('../../types/Filter.js').FilterSpecIn}
     */
    const filterRelationship = filter[relationship]

    const nextFilter = Array.isArray(filterRelationship) ?
        filterRelationship.filter(i => i instanceof Object).pop() :
        (filterRelationship ?? {})

    const child = includeTree.ensureChild(relationship, () => {
      const child = new IncludeTreeNode(resourceAttribute.map(a => jsonApiResources[a]))

      if (nextFilter && (!Array.isArray(nextFilter) || nextFilter.length !== 0)) {
        for (const [i, f] of Object.entries(nextFilter)) {
          if (typeof f !== 'string' && !Array.isArray(f)) continue
          child.addFilter(i, f)
        }
      }

      return child
    })
    this.#iterate(rest, child, nextFilter, validationErrors)
  }
}