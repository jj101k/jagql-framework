"use strict"

import { swaggerGenerator } from "../swagger/index.js"

/**
 *
 */
export class swagger {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     */
    static register(router, configStore) {
        if (!configStore.config.swagger) return

        /**
         * @type {ReturnType<swaggerGenerator.generateDocumentation>}
         */
        let cache

        router.bindRoute({
            verb: "get",
            path: "swagger.json"
        }, (request, resourceConfig, res) => {
            if (!cache) {
                cache = swaggerGenerator.generateDocumentation(configStore, request.inferredBaseUrl, router.resources)
            }

            return res.json(cache)
        })
    }
}