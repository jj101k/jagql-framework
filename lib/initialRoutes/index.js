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
     */
    static register(router, configStore) {
        for (const handler of [foreignKeySearch, swagger]) {
            handler.register(router, configStore)
        }
    }
}