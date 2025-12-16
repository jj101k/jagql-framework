"use strict"

import { swaggerGenerator } from "../swagger/index.js"

export class swagger {
    /**
     * @type {ReturnType<swaggerGenerator.generateDocumentation>}
     */
    static #cache
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
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