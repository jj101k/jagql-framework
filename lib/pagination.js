'use strict'
const ourJoi = require('./ourJoi.js')
/**
 * @typedef {import('../types/JsonApiRequest.js').JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
module.exports = class pagination {
  static joiPageDefinition = {
    page: ourJoi.Joi.object().keys({
      offset: ourJoi.Joi.number()
        .description('The first record to appear in the resulting payload')
        .example(0),
      limit: ourJoi.Joi.number()
        .description('The number of records to appear in the resulting payload')
        .example(50)
    })
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {number} handlerTotal
   * @returns
   */
  static generateMetaSummary(request, handlerTotal) {
    return {
      offset: request.params.page && request.params.page.offset,
      limit: request.params.page && request.params.page.limit,
      total: handlerTotal
    }
  }

  /**
   *
   * @param {JsonApiRequest} request
   */
  static importPaginationParams(request) {
    if (!request.params.page) {
      request.params.page = { }
    }
    const page = request.params.page

    page.offset = parseInt(page.offset, 10) || 0
    page.limit = parseInt(page.limit, 10) || 50
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {number} handlerTotal
   * @returns
   */
  static generatePageLinks(request, handlerTotal) {
    const pageData = request.params.page
    if (!handlerTotal || !pageData) {
      return { }
    }

    const lowerLimit = pageData.offset
    const upperLimit = pageData.offset + pageData.limit

    if ((lowerLimit === 0) && (upperLimit > handlerTotal)) {
      return { }
    }

    const pageLinks = { }
    const theirRequest = new URL(request.route.combined)
    theirRequest.search = ""

    if (lowerLimit > 0) {
      theirRequest.searchParams.set("page[offset]", "0")
      theirRequest.searchParams.set("page[limit]", pageData.limit)
      pageLinks.first = theirRequest.toString()

      if (pageData.offset > 0) {
        const previousPageOffset = Math.max(pageData.offset - pageData.limit, 0)
        theirRequest.searchParams.set("page[offset]", "" + previousPageOffset)
        pageLinks.prev = theirRequest.toString()
      }
    }

    if (upperLimit < handlerTotal) {
      const lastPage = Math.floor((handlerTotal - 1) / pageData.limit) * pageData.limit
      theirRequest.searchParams.set("page[offset]", "" + lastPage)
      theirRequest.searchParams.set("page[limit]", pageData.limit)
      pageLinks.last = theirRequest.toString()

      if ((pageData.offset + pageData.limit) < handlerTotal) {
        const nextPageOffset = pageData.offset + pageData.limit
        theirRequest.searchParams.set("page[offset]", nextPageOffset)
        pageLinks.next = theirRequest.toString()
      }
    }

    return pageLinks
  }
}