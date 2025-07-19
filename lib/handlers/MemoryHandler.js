'use strict'
const { Handler } = require('./Handler')
const _ = {
  assign: require('lodash.assign')
}

const Joi = require("joi")

class MemoryHandler extends Handler {
  static #clone (obj) { return JSON.parse(JSON.stringify(obj)) }
  static #indexOf (list, obj) {
    for (const i in list) {
      if (list[i].id === obj.id) return i
    }
    return -1
  }

  /**
   *
   * @param {{id: string}[]} resources
   * @param {string | string[]} [idFilter]
   * @returns
   */
  #filterResources(resources, idFilter) {
    if(!idFilter) {
      return resources
    }
    if(Array.isArray(idFilter)) {
      const idFilterMatch = new Set(idFilter)
      return resources.filter(resource => idFilterMatch.has(resource.id))
    } else {
      return resources.filter(resource => resource.id === idFilter)
    }
  }

  /**
   *
   * @param {{id: string}[]} resultSet
   * @param {{offset: number, limit: number}} [page]
   * @returns
   */
  #paginateResultSet(resultSet, page) {
    if (page) {
      return resultSet.slice(page.offset, page.offset + page.limit)
    } else {
      return resultSet
    }
  }

  constructor () {
    super()
    this.handlesSort = true
    this.resources = { }
  }

  /**
   *
   * @param {string} sortSpecRendered
   * @returns
   */
  #parseSortSpec(sortSpecRendered) {
    if (sortSpecRendered.startsWith("-")) {
      return {ascending: -1, attribute: sortSpecRendered.substring(1)}
    } else {
      return {ascending: 1, attribute: sortSpecRendered}
    }
  }

  /**
   Internal helper function to sort data
   */
  #sortList(request, list) {
    const sortSpec = request.params.sort
    if (!sortSpec) return

    const {ascending, attribute} = this.#parseSortSpec(`${sortSpec}`)

    list.sort((a, b) => {
      if (typeof a[attribute] === 'string') {
        return a[attribute].localeCompare(b[attribute]) * ascending
      } else if (typeof a[attribute] === 'number') {
        return (a[attribute] - b[attribute]) * ascending
      } else {
        return 0
      }
    })
  }

  /**
   * initialise gets invoked once for each resource that uses this hander.
   * In this instance, we're allocating an array in our in-memory data store.
   *
   * Compat: Joi 17
   *
   * @param {import("../../types/ResourceConfig").ResourceConfig<any>} resourceConfig
   */
  initialise (resourceConfig) {
    const schema = resourceConfig.attributes
    const compiled = Joi.compile(schema)
    const resources = resourceConfig.examples ? resourceConfig.examples.map(item => {
      const attrs = {...item}
      delete attrs.id
      delete attrs.type
      delete attrs.meta
      const validationResult = compiled.validate(attrs)
      if (validationResult.error) {
        return item
      } else {
        return {
          id: item.id,
          type: item.type,
          meta: item.meta,
          ...validationResult.value
        }
      }
    }) : []
    this.resources[resourceConfig.resource] = resources
    this.ready = true
  }

  /**
   * Search for a list of resources, given a resource type.
   *
   * @param {import('../../types/Handler').JsonApiRequest} request
   * @param {*} callback
   * @returns
   */
  search (request, callback) {
    const results = this.#filterResources(this.resources[request.params.type],
      request.params?.filter?.id)

    this.#sortList(request, results)
    const resultCount = results.length
    const resultsPage = this.#paginateResultSet(results, request.params.page)
    return callback(null, MemoryHandler.#clone(resultsPage), resultCount)
  }

  /**
   Delete a resource, given a resource type and and id.
   */
  delete (request, callback) {
    // Find the requested resource
    this.find(request, (err, theResource) => {
      if (err) return callback(err)

      // Remove the resource from the in-memory store.
      const index = MemoryHandler.#indexOf(this.resources[request.params.type], theResource)
      this.resources[request.params.type].splice(index, 1)

      // Return with no error
      return callback()
    })
  }

  /**
   Update a resource, given a resource type and id, along with a partialResource.
   partialResource contains a subset of changes that need to be merged over the original.
   */
  update (request, partialResource, callback) {
    // Find the requested resource
    this.find(request, (err, theResource) => {
      if (err) return callback(err)

      // Merge the partialResource over the original
      theResource = _.assign(theResource, partialResource)

      // Push the newly updated resource back into the in-memory store
      const index = MemoryHandler.#indexOf(this.resources[request.params.type], theResource)
      this.resources[request.params.type][index] = theResource

      // Return the newly updated resource
      return callback(null, MemoryHandler.#clone(theResource))
    })
  }

  /**
   Find a specific resource, given a resource type and and id.
   */
  find (request, callback) {
    // Pull the requested resource from the in-memory store
    const theResource = this.resources[request.params.type].filter(anyResource => anyResource.id === request.params.id).pop()

    // If the resource doesn't exist, error
    if (!theResource) {
      return callback({ // eslint-disable-line standard/no-callback-literal
        status: '404',
        code: 'ENOTFOUND',
        title: 'Requested resource does not exist',
        detail: `There is no ${request.params.type} with id ${request.params.id}`
      })
    }

    // Return the requested resource
    return callback(null, MemoryHandler.#clone(theResource))
  }
  /**
   Create (store) a new resource given a resource type and an object.
   */
  create (request, newResource, callback) {
    // Check to see if the ID already exists
    const index = MemoryHandler.#indexOf(this.resources[request.params.type], newResource)
    if (index !== -1) {
      return callback({ // eslint-disable-line standard/no-callback-literal
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Requested resource already exists',
        detail: `The requested resource already exists of type ${request.params.type} with id ${request.params.id}`
      })
    }
    // Push the newResource into our in-memory store.
    this.resources[request.params.type].push(newResource)
    // Return the newly created resource
    return callback(null, MemoryHandler.#clone(newResource))
  }
}

exports = module.exports = MemoryHandler
