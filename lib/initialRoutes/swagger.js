"use strict"

const router = require("../router.js")
const swaggerGenerator = require("../swagger/index.js")
const jsonApiConfig = require("../jsonApiConfig.js")

module.exports = class swagger {
  static #cache
  static register() {
    if (!jsonApiConfig.swagger) return

    router.bindRoute({
      verb: "get",
      path: "swagger.json"
    }, (request, resourceConfig, res) => {
      if (!this.#cache) {
        this.#cache = swaggerGenerator.generateDocumentation()
      }

      return res.json(this.#cache)
    })
  }
}