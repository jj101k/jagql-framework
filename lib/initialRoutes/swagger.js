"use strict"

import { swaggerGenerator } from "../swagger/index.js"

/**
 *
 */
export class swagger {
    /**
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     */
    static register(router, configStore, relationshipStore, joi) {
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
                cache = swaggerGenerator.generateDocumentation(configStore, request.inferredBaseUrl, router.resources, relationshipStore, joi)
            }

            return res.json(cache)
        })
    }
}