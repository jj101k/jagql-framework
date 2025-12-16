"use strict"

import { ourJoi } from "./ourJoi.js"

/**
 * @typedef {import("../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
export class pagination {
    /**
     *
     */
    static joiPageDefinition = {
        page: ourJoi.Joi.object().keys({
            offset: ourJoi.Joi.number()
                .description("The first record to appear in the resulting payload")
                .example(0),
            limit: ourJoi.Joi.number()
                .description("The number of records to appear in the resulting payload")
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
        const pageQuery = request.query.page
        return {
            offset: pageQuery?.offset,
            limit: pageQuery?.limit,
            total: handlerTotal
        }
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {number} handlerTotal
     * @returns
     */
    static generatePageLinks(request, handlerTotal) {
        const pageData = this.guaranteedPaginationParams(request)
        if (!handlerTotal || !pageData) {
            return {}
        }

        const lowerLimit = pageData.offset
        const upperLimit = pageData.offset + pageData.limit

        if ((lowerLimit === 0) && (upperLimit > handlerTotal)) {
            return {}
        }

        const pageLinks = {}
        const theirRequest = new URL(request.route.combined)
        theirRequest.search = ""

        if (lowerLimit > 0) {
            theirRequest.searchParams.set("page[offset]", "0")
            theirRequest.searchParams.set("page[limit]", "" + pageData.limit)
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
            theirRequest.searchParams.set("page[limit]", "" + pageData.limit)
            pageLinks.last = theirRequest.toString()

            if ((pageData.offset + pageData.limit) < handlerTotal) {
                const nextPageOffset = pageData.offset + pageData.limit
                theirRequest.searchParams.set("page[offset]", "" + nextPageOffset)
                pageLinks.next = theirRequest.toString()
            }
        }

        return pageLinks
    }


    /**
     *
     * @param {JsonApiRequest} request
     */
    static guaranteedPaginationParams(request) {
        const page = request.query.page ??= {}

        /**
         *
         * @param {string | number | undefined} v
         * @returns
         */
        const numberValue = v => {
            if (typeof v == "number") {
                return v
            } else if (v) {
                return +v
            } else {
                return null
            }
        }

        return {
            offset: numberValue(page?.offset) ?? 0,
            limit: numberValue(page?.limit) ?? 50,
        }
    }
}