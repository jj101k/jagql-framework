"use strict"

const helper = require("../routes/helper.js")
const router = require("../router.js")
const postProcess = require("../postProcess.js")
const responseHelper = require("../responseHelper.js")
const PromisifyHandler = require("../promisifyHandler.js")
const Relationship = require("../Relationship.js")
const Prop = require("../Prop.js")
const { JsonApiError } = require("../errorHandlers/JsonApiError.js")

/**
 *
 */
module.exports = class foreignKeySearch {
    /**
     *
     */
    static register() {
        const NonForeignKeyParam = new Set(["include", "type", "sort", "filter",
            "fields", "requestId"])
        router.bindRoute({
            verb: "GET",
            path: ":type/relationships/?"
        }, async (request, resourceConfig, res) => {
            const type = request.routeParams.type
            let response

            const handler = PromisifyHandler.for(resourceConfig?.handlers)
            try {
                helper.verifyRequest(request, resourceConfig, "search")

                const foreignKey = Object.keys(request.query).filter(
                    param => !NonForeignKeyParam.has(param)).pop()

                if (!foreignKey) {
                    throw new JsonApiError({
                        status: 400,
                        code: "EINVALID",
                        title: "Relationship search is missing the relationship name",
                        detail: `None of the supplied query args are a relationship within ${type}`
                    })
                }

                request.appParams.relationships = { [foreignKey]: request.query[foreignKey] }
                delete request.query[foreignKey]

                // Compat only
                request.params.relationships = request.appParams.relationships
                delete request.params[foreignKey]

                if (!Prop.hasProperty(resourceConfig, foreignKey)) {
                    throw new JsonApiError({
                        status: 403,
                        code: "EFORBIDDEN",
                        title: "Invalid foreign key lookup",
                        detail: `Relationship [${foreignKey}] does not exist within ${type}`
                    })
                }
                if (!Relationship.getRelationship(resourceConfig, foreignKey)) {
                    throw new JsonApiError({
                        status: 403,
                        code: "EFORBIDDEN",
                        title: "Invalid foreign key lookup",
                        detail: `Attribute [${foreignKey}] does not represent a relationship within ${type}`
                    })
                }

                const [results, pageData] = await handler.search(request)

                const searchResultsIn = results.map(result => ({
                    id: "" + result.id,
                    type: result.type
                }))
                const searchResults = Prop.hasProperty(resourceConfig, foreignKey) ?
                    searchResultsIn[0] || null :
                    searchResultsIn

                response = responseHelper.generateResponse(request, resourceConfig, searchResults, pageData)
                response.included = []
                await postProcess.handleAny(request, response)
            } catch (err) {
                return helper.handleError(request, res, err)
            }

            return router.sendResponse(res, response, 200)
        })
    }
}
