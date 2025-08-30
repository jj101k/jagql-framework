"use strict"

const helper = require("../routes/helper.js")
const router = require("../router.js")
const postProcess = require("../postProcess.js")
const responseHelper = require("../responseHelper.js")
const PromisifyHandler = require("../promisifyHandler.js")
const Relationship = require("../Relationship.js")
const Prop = require("../Prop.js")
const { JsonApiError } = require("../errorHandlers/JsonApiError.js")

module.exports = class foreignKeySearch {
  static register() {
    const NonForeignKeyParam = new Set(["include", "type", "sort", "filter",
      "fields", "requestId"])
    router.bindRoute({
      verb: "get",
      path: ":type/relationships/?"
    }, async (request, resourceConfig, res) => {
      let response

      const handler = PromisifyHandler.for(resourceConfig?.handlers)
      try {
        helper.verifyRequest(request, resourceConfig, "search")

        const foreignKey = Object.keys(request.params).filter(
          param => !NonForeignKeyParam.has(param)).pop()
        request.params.relationships = { }
        request.params.relationships[foreignKey] = request.params[foreignKey]
        delete request.params[foreignKey]

        if (!Prop.hasProperty(resourceConfig, foreignKey)) {
          throw new JsonApiError({
            status: 403,
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: `Relationship [${foreignKey}] does not exist within ${request.params.type}`
          })
        }
        if (!Relationship.getRelationship(resourceConfig, foreignKey)) {
          throw new JsonApiError({
            status: 403,
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: `Attribute [${foreignKey}] does not represent a relationship within ${request.params.type}`
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
        response.included = [ ]
        await postProcess.handle(request, response)
      } catch(err) {
        return helper.handleError(request, res, err)
      }

      return router.sendResponse(res, response, 200)
    })
  }
}
