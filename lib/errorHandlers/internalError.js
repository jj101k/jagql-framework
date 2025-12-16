"use strict"

import { jsonApiErrHandler } from "../jsonApiErrHandler.js"
import { helper } from "../routes/helper.js"
import { JsonApiError } from "./JsonApiError.js"

/**
 *
 */
export class internalError {
    /**
     *
     * @param {*} error
     * @returns
     */
    static #isJsonApiLikeError(error) {
        return error instanceof JsonApiError || (error["code"] && error["status"])
    }

    /**
     * @param {import("../Router.js").Router} router
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