'use strict'
const _ = {
  uniqBy: require('lodash.uniqby')
}
const rerouter = require('../rerouter.js')
const debug = require('../debugging.js')
const tools = require('../tools.js')
const jsonApiResources = require('../jsonApiResources.js')
const jsonApiConfig = require('../jsonApiConfig.js')
const Relation = require('../Relation.js')

/**
 * @typedef {{_dataItems: any[] | null, _resourceConfig: import('../../types/ResourceConfig.js').ResourceConfig[]}} TreeNode
 */

/**
 *
 */
module.exports = class includePP {
  /**
   * Called once per request during post-processing
   *
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @param {() => any} callback
   * @returns
   */
  static async action(request, response, callback) {
    const filters = request.params.filter
    if (!request.params.include) return callback()
    const includes = (`${request.params.include}`).split(',')

    try {
      const includeTree = this.#arrayToTree(request, includes, filters)

      const dataItems = tools.ensureArrayNotNullish(response.data)
      includeTree._dataItems = dataItems

      await this.#fillIncludeTree(includeTree, request)

      includeTree._dataItems = [ ]
      response.included = this.#getDataItemsFromTree(includeTree)
      response.included = _.uniqBy(response.included, someItem => `${someItem.type}~~${someItem.id}`)
    } catch(err) {
      return callback(err)
    }

    callback()
  }

  /**
   * Called once per request during post-processing
   *
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {string[]} includes
   * @param {import('../../types/Handler.js').FilterSpecByAttrIn | undefined} filters
   * @returns
   */
  static #arrayToTree(request, includes, filters) {
    /**
     * @type {import('../../types/Handler.js').JsonApiError[]}
     */
    const validationErrors = [ ]

    /**
     * @type {TreeNode}
     */
    const tree = {
      _dataItems: null,
      _resourceConfig: [ ...tools.ensureArray(request.resourceConfig) ]
    }

    for(const include of includes) {
      this.#iterate(include, tree, filters, validationErrors)
    }

    if (validationErrors.length > 0) throw validationErrors
    return tree
  }

  /**
   *
   * @param {TreeNode} tree
   * @returns
   */
  static #getDataItemsFromTree(tree) {
    const items = tree._dataItems
    for (const [k, data] of Object.entries(tree)) {
      if (!k.startsWith("_")) {
        items.push(...this.#getDataItemsFromTree(data))
      }
    }
    return items
  }

  /**
   *
   * @param {TreeNode} includeTree
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   */
  static async #fillIncludeTree(includeTree, request) {
    /** **
    includeTree = {
      _dataItems: [ ],
      _filter: { },
      _resourceConfig: { },
      person: { includeTree },
      booking: { includeTree }
    };
    ****/
    const includes = Object.keys(includeTree).filter(k => !k.startsWith("_"))

    /**
     * @type {{primary: Record<string, string[]>, foreign: Record<string, string[]>}
     */
    const relationsToInclude = {
      primary: { },
      foreign: { }
    }

    /**
     * @param {TreeNode} nestedIncludeTree
     */
    const getNestedIncludes = (nestedIncludeTree) => {
      return Object.keys(nestedIncludeTree).filter(k => !k.startsWith("_"))
    }

    for(const dataItem of includeTree._dataItems) {
      if (!dataItem?.relationships) continue
      const relations = Object.keys(dataItem.relationships).filter(
        keyName => !keyName.startsWith("_") && includes.includes(keyName))
      for(const relation of relations) {
        const someRelation = dataItem.relationships[relation]

        if (someRelation.meta.relation === 'primary') {
          if(someRelation.data === undefined) {
            console.warn(`Relation ${relation} is missing from the response, skipping`)
          }
          const relationItems = tools.ensureArrayNotNullish(someRelation.data)
          for(const relationItem of relationItems) {
            const key = `${relationItem.type}~~${relation}~~${relation}`
            relationsToInclude.primary[key] ??= []
            relationsToInclude.primary[key].push(relationItem.id)
          }
        } else if (someRelation.meta.relation === 'foreign') {
          const key = `${someRelation.meta.as}~~${someRelation.meta.belongsTo}~~${relation}`
          relationsToInclude.foreign[key] ??= []
          relationsToInclude.foreign[key].push(dataItem.id)
        }
      }
    }

    /**
     * @type {{url: string, as: string}[]}
     */
    const resourcesToFetch = []

    for(const relationSpec of Object.keys(relationsToInclude.primary)) {
      const ids = [...new Set(relationsToInclude.primary[relationSpec])]
      const [resource, relation] = relationSpec.split('~~')
      let query = ids.map(id => `filter[id]=${id}`).join("&")
      if (includeTree[relation]._filter) {
        query += `&${includeTree[relation]._filter.join('&')}`
      }
      const nestedIncludes = getNestedIncludes(includeTree[relation])
      if (nestedIncludes.length) {
        query += `&include=${nestedIncludes.join(",")}`
      }
      resourcesToFetch.push({
        url: `${jsonApiConfig.base + resource}/?${query}`,
        as: relationSpec
      })
    }

    for(const relationSpec of Object.keys(relationsToInclude.foreign)) {
      const ids = [...new Set(relationsToInclude.foreign[relationSpec])]
      ids.sort((a, b) => a.localeCompare(b))
      const [parentField, resource, relation] = relationSpec.split('~~')
      let query = ids.map(id => `filter[${parentField}]=${id}`).join("&")
      if (includeTree[relation]._filter) {
        query += `&${includeTree[relation]._filter.join('&')}`
      }
      const nestedIncludes = getNestedIncludes(includeTree[relation])
      if (nestedIncludes.length) {
        query += `&include=${nestedIncludes.join(",")}`
      }
      resourcesToFetch.push({
        url: `${jsonApiConfig.base + resource}/?${query}`,
        as: relationSpec
      })
    }

    for(const related of resourcesToFetch) {
      const parts = related.as.split('~~')
      debug.include(related)

      let json
      try {
        json = await rerouter.route({
          method: 'GET',
          uri: related.url,
          originalRequest: request,
          params: {
            page: {offset: 0, limit: Math.pow(2, 32)} // Essentially no limit
          }
        })
      } catch(err) {
        debug.include('!!', JSON.stringify(err))
        throw err.errors
      }

      const data = tools.ensureArrayNotNullish(json.data)
      includeTree[parts[2]]._dataItems.push(...data)
    }
    for(const include of includes) {
      if (include[0] === '_') continue

      await this.#fillIncludeTree(includeTree[include], request)
    }
  }

  /**
   * Called once per include during post-processing
   *
   * @param {string} text
   * @param {TreeNode} node
   * @param {import('../../types/Handler.js').FilterSpecByAttrIn | undefined} filter
   * @param {import('../../types/Handler.js').JsonApiError[]} validationErrors
   * @returns
   */
  static #iterate(text, node, filter, validationErrors) {
    if (text.length === 0) return null
    const parts = text.split('.')
    const relation = parts.shift()
    const rest = parts.join('.')
    if (!filter) filter = {}

    const [activeResourceConfig] = node._resourceConfig.filter(
      resourceConfig => Relation.hasProperty(resourceConfig, relation))
    if (!activeResourceConfig) {
      const resourceNames = node._resourceConfig.map(r => r.resource)
      return validationErrors.push({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${resourceNames.join(" | ")} do not have property ${relation}`
      })
    }
    const rel = Relation.getRelation(activeResourceConfig, relation)

    if (!rel) {
      return validationErrors.push({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${node._resourceConfig.resource}.${relation} is not a relation and cannot be included`
      })
    }
    const resourceAttribute = rel.resources

    /**
     * @type {import('../../types/Handler.js').FilterSpecIn}
     */
    const filterRelation = filter[relation]

    const nextFilter = Array.isArray(filterRelation) ?
        filterRelation.filter(i => i instanceof Object).pop() :
        (filterRelation ?? {})

    if (!node[relation]) {
      node[relation] = {
        _dataItems: [ ],
        _resourceConfig: resourceAttribute.map(a => jsonApiResources[a]),
        _filter: [ ]
      }

      if (nextFilter && (!Array.isArray(nextFilter) || nextFilter.length !== 0)) {
        for (const [i, f] of Object.entries(nextFilter)) {
          if (typeof f !== 'string' && !Array.isArray(f)) continue
          node[relation]._filter.push(`filter[${i}]=${f}`)
        }
      }
    }
    this.#iterate(rest, node[relation], nextFilter, validationErrors)
  }
}