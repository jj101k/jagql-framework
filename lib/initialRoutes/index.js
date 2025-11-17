"use strict"
const foreignKeySearchRoute = require("./foreignKeySearch")
const swagger = require("./swagger")

/**
 *
 */
module.exports = class initialRoutes {
    /**
     * @type {Record<string, {register(): void}>}
     */
    static handlers = { }

    /**
     *
     */
    static register() {
        this.handlers.foreignKeySearch = foreignKeySearchRoute
        this.handlers.swagger = swagger
        for (const handler of Object.values(this.handlers)) {
            handler.register()
        }
    }
}