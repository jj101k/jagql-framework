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
     * @type {Record<string, {register(configStore: ConfigStore): void}>}
     */
    static handlers = { }

    /**
     * @param {import("../Router.js").Router} router
     * @param {ConfigStore} configStore
     */
    static register(router, configStore) {
        this.handlers.foreignKeySearch = foreignKeySearch
        this.handlers.swagger = swagger
        for (const handler of Object.values(this.handlers)) {
            handler.register(router, configStore)
        }
    }
}