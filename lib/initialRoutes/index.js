"use strict"
import { foreignKeySearch } from "./foreignKeySearch.js"
import { swagger } from "./swagger.js"

/**
 * @typedef {import("../ConfigStore.js").ConfigStore} ConfigStore
 */

/**
 *
 */
export class initialRoutes {
    /**
     * @param {import("../Router.js").Router} router
     * @param {ConfigStore} configStore
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     */
    static register(router, configStore, responseHelper, relationshipStore, joi) {
        for (const handler of [foreignKeySearch, swagger]) {
            handler.register(router, configStore, responseHelper, relationshipStore, joi)
        }
    }
}