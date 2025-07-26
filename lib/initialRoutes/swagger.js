"use strict"

const router = require("../router.js")
const swaggerGenerator = require("../swagger/index.js")
const jsonApiConfig = require("../jsonApiConfig.js")

module.exports = class swagger {
  static register() {
    if (!jsonApiConfig.swagger) return

    router.bindRoute({
      verb: "get",
      path: "swagger.json"
    }, (request, resourceConfig, res) => {
      if (!swagger._cache) {
        swagger._cache = swaggerGenerator.generateDocumentation()
      }

      return res.json(swagger._cache)
    })
  }
}