'use strict'
const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const pagination = require('../pagination.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')
const PaginationEnforcer = require('../PaginationEnforcer.js')
const RemoteRelationshipStripper = require('../RemoteRelationshipStripper.js')
const ArraySchemaChecker = require('../ArraySchemaChecker.js')
const DataItemInfo = require('../DataItemInfo.js')

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
            const schemaChecker = new ArraySchemaChecker(resourceConfig)
            const dataItemInfo = new DataItemInfo(resourceConfig)

            /**
             * @type {import('../../types/JsonApiResponse.js').JsonApiResourceObject[]}
             */
            let sanitisedData
            /**
             * @type {number}
             */
            let paginationInfo
            if("next" in r) {
                sanitisedData = []
                paginationInfo = 0
                const relStripper = new RemoteRelationshipStripper(resourceConfig)
                for await (const [sr, pi] of r) {
                    const page = paginationEnforcer.enforce(sr)
                    relStripper.strip(page)
                    sanitisedData.push(...await responseHelper.generateDataItems(page, dataItemInfo))
                    paginationInfo += pi
                    if(!schemaChecker.exhausted) {
                        await schemaChecker.check(...page)
                    }
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
                const searchResults = paginationEnforcer.enforce(searchResultsIn)
                postProcess.stripRemoteRelationships(searchResults, resourceConfig)
                await schemaChecker.check(...searchResults)
                sanitisedData = await responseHelper.generateDataItems(searchResults, dataItemInfo)
            }

            response = responseHelper.generateResponse(request, resourceConfig, sanitisedData, paginationInfo)
            response.included = []
            await postProcess.handleMulti(request, response)

            return router.sendResponse(res, response, 200)
        })
    }
}