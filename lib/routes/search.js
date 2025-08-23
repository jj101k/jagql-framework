'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const pagination = require('../pagination.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')
const PaginationEnforcer = require('../PaginationEnforcer.js')
const RemoteRelationsStripper = require('../RemoteRelationsStripper.js')

module.exports = class searchRoute {
    static register() {
        router.bindRoute({
            verb: 'get',
            path: ':type'
        }, async (request, resourceConfig, res) => {
            let response
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'search')

            helper.validateSearch(request, resourceConfig)

            filter.parseAndValidate(request)

            pagination.importPaginationParams(request)

            const r = handler.search(request)

            const paginationEnforcer = new PaginationEnforcer(request)

            /**
             * @type {any[]}
             */
            let searchResults
            /**
             * @type {number}
             */
            let paginationInfo
            if("next" in r) {
                searchResults = []
                paginationInfo = 0
                const relStripper = new RemoteRelationsStripper(resourceConfig)
                for await (const [sr, pi] of r) {
                    const page = paginationEnforcer.enforce(sr)
                    relStripper.strip(page)
                    searchResults.push(...page)
                    paginationInfo += pi
                    if(paginationEnforcer.exhausted) {
                        break
                    }
                }
            } else {
                /**
                 * @type {typeof searchResults}
                 */
                let searchResultsIn
                [searchResultsIn, paginationInfo] = await r
                searchResults = paginationEnforcer.enforce(searchResultsIn)
                postProcess.stripRemoteRelations(searchResults, resourceConfig)
            }

            const sanitisedData = await responseHelper.checkSchemaOnArray(searchResults, resourceConfig)

            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, paginationInfo)
            response.included = []
            await postProcess.handle(request, response)

            return router.sendResponse(res, response, 200)
        })
    }
}