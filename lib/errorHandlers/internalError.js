"use strict"

const helper = require("../routes/helper.js")
const router = require("../Router.js")
const jsonApiErrHandler = require("../jsonApiErrHandler.js")
const { JsonApiError } = require("./JsonApiError.js")

/**
 *
 */
module.exports = class internalError {
    /**
     *
     * @param {*} error
     * @returns
     */
    static #isJsonApiLikeError(error) {
        return error instanceof JsonApiError || (error["code"] && error["status"])
    }

    /**
     * @param {import("../Router.js")} router
     */
    static register(router) {
        router.bindErrorHandler((request, res, errorState) => {
            if (
                this.#isJsonApiLikeError(errorState) ||
                (Array.isArray(errorState) && errorState.every(e => this.#isJsonApiLikeError(e)))
            ) {
                return helper.handleError(router, request, res, errorState)
            }
            if (jsonApiErrHandler.handler) {
                jsonApiErrHandler.handler(request, errorState)
            }

            return helper.handleError(router, request, res, new JsonApiError({
                status: 500,
                code: "EUNKNOWN",
                title: "An unknown error has occured. Sorry?",
                detail: "??"
            }))
        })
    }
}