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

// sometimes the resourceConfig is an object... sometimes it's an array.
function getHandlerFromRequest (request) {
  let rc = request.resourceConfig || {}
  if (rc instanceof Array) {
    rc = rc[0] || {}
  }
  return rc.handlers || {}
}

module.exports = class postProcess {
  static _applySort = srt.action.bind(srt)
  static _applyFilter = filter.action.bind(filter)
  static _applyIncludes = incl.action.bind(incl)
  static _applyFields = fields.action.bind(fields)

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
    await Promisify.promisify(f)(request, response)
    delete request.postProcess
  }

  /**
   *
   * @param {import('../types/Handler.js').JsonApiRequest} request
   * @param {import('../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
   */
  static async handle(request, response) {
    const handler = getHandlerFromRequest(request)
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
    let dataItems = mainResource[request.params.relation]

    if (!dataItems) return [[ null ], null]

    if (!(Array.isArray(dataItems))) dataItems = [ dataItems ]

    const page = request.params.page
    const total = dataItems.length
    const dataItemsPage = dataItems.slice(page.offset,
      page.offset + page.limit)

    let resourcesToFetch = dataItemsPage.reduce((map, dataItem) => {
      map[dataItem.type] = map[dataItem.type] || [ ]
      map[dataItem.type].push(dataItem.id)
      return map
    }, { })

    resourcesToFetch = Object.keys(resourcesToFetch).map(type => {
      let ids = resourcesToFetch[type]
      const urlJoiner = '&filter[id]='
      ids = urlJoiner + ids.join(urlJoiner)
      let uri = `${jsonApi._apiConfig.pathPrefix + type}/?${ids}`
      if (request.route.query) {
        uri += `&${request.route.query}`
      }
      return uri
    })

    const otherResources = []
    for(const related of resourcesToFetch) {
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
      let data = json.data

      if (!(Array.isArray(data))) data = [ data ]

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