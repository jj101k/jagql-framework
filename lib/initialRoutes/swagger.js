"use strict"

const router = require("../router.js")
const swaggerGenerator = require("../swagger/index.js")
const ConfigStore = require("../ConfigStore.js")

module.exports = class swagger {
    /**
     * @type {ReturnType<swaggerGenerator.generateDocumentation>}
     */
    static #cache
    /**
     *
     * @returns
     */
    static register() {
        if (!ConfigStore.config.swagger) return

        router.bindRoute({
            verb: "get",
            path: "swagger.json"
        }, (request, resourceConfig, res) => {
            if (!this.#cache) {
                this.#cache = swaggerGenerator.generateDocumentation(request.inferredBaseUrl)
            }

            return res.json(this.#cache)
        })
    }
}