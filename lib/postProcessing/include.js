'use strict'
const jsonApi = require('../jsonApi.js')
const _ = {
  uniq: require('lodash.uniq'),
  uniqBy: require('lodash.uniqby')
}
const rerouter = require('../rerouter.js')
const async = require('async')
const debug = require('../debugging.js')
const ourJoi = require("../ourJoi.js")

/**
 * @typedef {{_dataItems: null, _resourceConfig: import('../../types/ResourceConfig.js').ResourceConfig[]}} TreeNode
 */

/**
 *
 */
module.exports = class includePP {
  /**
   *
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @param {() => any} callback
   * @returns
   */
  static action(request, response, callback) {
    /**
     * @type {string[] | undefined}
     */
    let includes = request.params.include
    const filters = request.params.filter
    if (!includes) return callback()
    includes = (`${includes}`).split(',')

    /**
     * @type {TreeNode}
     */
    let includeTree
    try {
      includeTree = this.#arrayToTree(request, includes, filters)
    } catch(err) {
      callback(err)
    }

    let dataItems = response.data
    if (!(Array.isArray(dataItems))) dataItems = [ dataItems ]
    includeTree._dataItems = dataItems

    this.#fillIncludeTree(includeTree, request, fiErr => {
      if (fiErr) return callback(fiErr)

      includeTree._dataItems = [ ]
      response.included = this.#getDataItemsFromTree(includeTree)
      response.included = _.uniqBy(response.included, someItem => `${someItem.type}~~${someItem.id}`)

      return callback()
    })
  }

  /**
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
      _resourceConfig: [ ].concat(request.resourceConfig)
    }

    for(const include of includes) {
      this.#iterate(include, tree, filters, validationErrors)
    }

    if (validationErrors.length > 0) throw validationErrors
    return tree
  }

  static #getDataItemsFromTree(tree) {
    let items = tree._dataItems
    for (const i in tree) {
      if (i[0] !== '_') {
        items = items.concat(this.#getDataItemsFromTree(tree[i]))
      }
    }
    return items
  }

  /**
   *
   * @param {TreeNode} includeTree
   * @param {import('../../types/Handler.js').JsonApiRequest} request
   * @param {(err?: any) => any} callback
   */
  static #fillIncludeTree(includeTree, request, callback) {
    /** **
    includeTree = {
      _dataItems: [ ],
      _filter: { },
      _resourceConfig: { },
      person: { includeTree },
      booking: { includeTree }
    };
    ****/
    const includes = Object.keys(includeTree)

    /**
     * @type {{primary: Record<string, string[]>, foreign: Record<string, string[]>}
     */
    const relationsToInclude = {
      primary: { },
      foreign: { }
    }
    for(const dataItem of includeTree._dataItems) {
      if (!dataItem?.relationships) continue
      const relations = Object.keys(dataItem.relationships).filter(
        keyName => !keyName.startsWith("_") && includes.includes(keyName))
      for(const relation of relations) {
        const someRelation = dataItem.relationships[relation]

        if (someRelation.meta.relation === 'primary') {
          if (!someRelation.data) {
            if(someRelation.data !== null) {
              console.warn(`Relation ${relation} is missing from the response, skipping`)
            }
            continue
          }
          const relationItems = Array.isArray(someRelation.data) ?
            someRelation.data : [someRelation.data]
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
      resourcesToFetch.push({
        url: `${jsonApi._apiConfig.base + resource}/?${query}`,
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
      resourcesToFetch.push({
        url: `${jsonApi._apiConfig.base + resource}/?${query}`,
        as: relationSpec
      })
    }

    async.map(resourcesToFetch, (related, done) => {
      const parts = related.as.split('~~')
      debug.include(related)

      rerouter.route({
        method: 'GET',
        uri: related.url,
        originalRequest: request,
        params: {
          page: {offset: 0, limit: Math.pow(2, 32)} // Essentially no limit
        }
      }, (err, json) => {
        if (err) {
          debug.include('!!', JSON.stringify(err))
          return done(err.errors)
        }

        let data = json.data
        if (!data) return done()
        if (!(Array.isArray(data))) data = [ data ]
        includeTree[parts[2]]._dataItems = includeTree[parts[2]]._dataItems.concat(data)
        return done()
      })
    }, err => {
      if (err) return callback(err)

      async.map(includes, (include, done) => {
        if (include[0] === '_') return done()
        this.#fillIncludeTree(includeTree[include], request, done)
      }, callback)
    })
  }

  /**
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

    let resourceAttribute = node._resourceConfig.map(resourceConfig => {
      return resourceConfig.attributes[relation]
    }).filter(a => a).pop()
    if (!resourceAttribute) {
      const resourceNames = node._resourceConfig.map(r => r.resource)
      return validationErrors.push({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${resourceNames.join(" | ")} do not have property ${relation}`
      })
    }
    const settings = ourJoi.getSettings(resourceAttribute)
    resourceAttribute = settings.__one || settings.__many
    if (!resourceAttribute) {
      return validationErrors.push({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid inclusion',
        detail: `${node._resourceConfig.resource}.${relation} is not a relation and cannot be included`
      })
    }

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
        _resourceConfig: resourceAttribute.map(a => jsonApi._resources[a]),
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