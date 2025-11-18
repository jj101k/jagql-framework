"use strict"
const foreignKeySearchRoute = require("./foreignKeySearch")
const swagger = require("./swagger")

/**
 *
 */
module.exports = class initialRoutes {
    /**
     * @type {Record<string, {register(configStore: import("../ConfigStore.js")): void}>}
     */
    static handlers = { }

    /**
     * @param {import("../Router.js")} router
     * @param {import("../ConfigStore.js")} configStore
     */
    static register(router, configStore) {
        this.handlers.foreignKeySearch = foreignKeySearchRoute
        this.handlers.swagger = swagger
        for (const handler of Object.values(this.handlers)) {
            handler.register(router, configStore)
        }
    }
}