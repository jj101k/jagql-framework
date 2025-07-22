'use strict'
const jsonApi = require('./jsonApi.js')
const debug = require('./debugging.js')
const rerouter = require('./rerouter.js')
const ourJoi = require("./ourJoi.js")
const srt = require('./postProcessing/sort.js')
const filter = require('./postProcessing/filter.js')
const incl = require('./postProcessing/include.js')
const fields = require('./postProcessing/fields.js')
const { Promisify } = require('./promisify.js')

module.exports = class postProcess {
  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @returns
   */
  static #getHandlerFromRequest(request) {
    // sometimes the resourceConfig is an object... sometimes it's an array.
    const rc = (request.resourceConfig instanceof Array) ?
      request.resourceConfig[0] : request.resourceConfig
    return rc?.handlers ?? {}
  }

  static _applySort = Promisify.promisify(srt, "action")
  static _applyFilter = Promisify.promisify(filter, "action")
  static _applyIncludes = Promisify.promisify(incl, "action")
  static _applyFields = Promisify.promisify(fields, "action")

  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {import('../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   * @param {string} name
   * @param {(request: import('../types/Handler.js').JsonApiRequest, response:
   * import('../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta,
   * callback: (err) => *) => *} f
   */
  static async #postProcess(request, response, name, f) {
    request.postProcess = name
    await f(request, response)
    delete request.postProcess
  }

  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {import('../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   */
  static async handle(request, response) {
    const handler = this.#getHandlerFromRequest(request)
    if(!handler.handlesSort) {
      await this.#postProcess(request, response, "sort", this._applySort)
    }
    if(!handler.handlesFilter) {
      await this.#postProcess(request, response, "filter", this._applyFilter)
    }
    // not permitting handlers to skip includes or fields, since these two steps cross the bounds into
    // other handlers' data.
    await this.#postProcess(request, response, "includes", this._applyIncludes)
    await this.#postProcess(request, response, "fields", this._applyFields)
  }

  /**
   * @public
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {*} mainResource
   * @returns
   */
  static async _fetchRelatedResources(request, mainResource) {
    // Fetch the other objects
    const dataItems = mainResource[request.params.relation]

    if (!dataItems) return [[ null ], null]

    const allDataItems = Array.isArray(dataItems) ? dataItems : [dataItems]

    const page = request.params.page
    const total = allDataItems.length
    const dataItemsPage = allDataItems.slice(page.offset,
      page.offset + page.limit)

    const resourcesToFetch = dataItemsPage.reduce((map, dataItem) => {
      map[dataItem.type] = map[dataItem.type] || [ ]
      map[dataItem.type].push(dataItem.id)
      return map
    }, { })

    const resourceUrisToFetch = Object.keys(resourcesToFetch).map(type => {
      const ids = resourcesToFetch[type]
      let query = ids.map(id => `filter[id]=${id}`).join("&")
      if (request.route.query) {
        query += `&${request.route.query}`
      }
      return `${jsonApi._apiConfig.pathPrefix + type}/?${query}`
    })

    const otherResources = []
    for(const related of resourceUrisToFetch) {
      debug.include(related)

      let json
      try {
        json = await rerouter.route({
          method: 'GET',
          uri: related,
          originalRequest: request,
          params: { filter: request.params.filter,
            page: { offset: 0, limit: dataItemsPage.length } }
        })
      } catch(err) {
        debug.include('!!', JSON.stringify(err))
        throw err.errors
      }
      const data = Array.isArray(json.data) ? json.data : [json.data]

      otherResources.push(data)
    }
    const relatedResources = [].concat.apply([], otherResources)
    return [relatedResources, total]
  }

  /**
   *
   * @param {*[] | *} itemOrItems
   * @param {import('../types/ResourceConfig.js').ResourceAttributes} schema
   * @returns
   */
  static fetchForeignKeys(itemOrItems, schema) {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems]
    for(const item of items) {
      for (const i in schema) {
        const settings = ourJoi.getSettings(schema[i])
        if (settings && settings.__as) {
          item[i] = undefined
        }
      }
    }
  }
}