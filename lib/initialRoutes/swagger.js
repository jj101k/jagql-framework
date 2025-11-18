"use strict"

const router = require("../Router.js")
const swaggerGenerator = require("../swagger/index.js")
const ConfigStore = require("../ConfigStore.js")

module.exports = class swagger {
    /**
     * @type {ReturnType<swaggerGenerator.generateDocumentation>}
     */
    static #cache
    /**
     * @param {import("../Router.js")} router
     * @param {import("../ConfigStore.js")} configStore
     */
    static register(router, configStore) {
        if (!configStore.config.swagger) return

        router.bindRoute({
            verb: "get",
            path: "swagger.json"
        }, (request, resourceConfig, res) => {
            if (!this.#cache) {
                this.#cache = swaggerGenerator.generateDocumentation(configStore, request.inferredBaseUrl)
            }

            return res.json(this.#cache)
        })
    }
}