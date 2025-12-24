"use strict"

import Joi from "joi"
import { debug } from "../debug.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"

/**
 * @typedef {import("../JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
export class helper {
    /**
     * Compat: Joi 17
     *
     * @param {*} someObject
     * @param {*} someDefinition
     * @throws
     * @returns
     */
    static #validate(someObject, someDefinition) {
        debug.validationInput(JSON.stringify(someObject))
        const schema = Joi.compile(someDefinition)
        const result = schema.validate(someObject, { abortEarly: false })
        if (result.error) {
            throw new JsonApiError({
                status: 403,
                code: "EFORBIDDEN",
                title: "Param validation failed",
                detail: result.error.details.map(d => d.message).join("; "),
                meta: { details: result.error.details }
            })
        }
        Object.assign(someObject, result.value)
    }

    /**
     *
     * @param {JsonApiRequest} request
     */
    static checkForBody(request) {
        const body = request.body.data
        if (!body) {
            throw new JsonApiError({
                status: 403,
                code: "EFORBIDDEN",
                title: "Request validation failed",
                detail: `Missing "data" - have you sent the right http headers?`
            })
        }
        // data can be {} or [] both of which are typeof === "object"
        if (typeof body !== "object") {
            throw new JsonApiError({
                status: 403,
                code: "EFORBIDDEN",
                title: "Request validation failed",
                detail: `"data" must be an object - have you sent the right http headers?`
            })
        }
    }

    /**
     *
     * @param {import("../Router.js").Router} router
     * @param {JsonApiRequest} request
     * @param {import("express").Response} res
     * @param {JsonApiError | JsonApiError[] | unknown} errOrErrs
     * @param {import("../responseHelper.js").responseHelper} responseHelper
     * @returns
     */
    static handleError(router, request, res, errOrErrs, responseHelper) {
        console.error(errOrErrs)
        if (res.headersSent) {
            console.warn("Headers already sent - will just terminate the response")
        }
        const errorResponse = responseHelper.generateError(request, errOrErrs)
        const httpCode = errorResponse.errors[0].status || 500
        return router.sendResponse(res, errorResponse, +httpCode)
    }

    /**
     *
     * @template R
     * @param {*} someObject
     * @param {import("../ResourceConfig.js").ResourceConfig<R>} resourceConfig
     */
    static validateCreate(someObject, resourceConfig) {
        return this.#validate(someObject, resourceConfig.onCreate)
    }

    /**
     *
     * @template R
     * @param {R} someObject
     * @param {import("../ResourceConfig.js").ResourceConfig<R>} resourceConfig
     * @param {(keyof R)[]} [keys]
     */
    static validateCreateExplicit(someObject, resourceConfig, keys) {
        const explicitKeys = new Set(keys)
        const validationObject = Object.fromEntries(Object.entries(resourceConfig.onCreate).filter(
            ([k]) => explicitKeys.has(k)))
        return this.#validate(someObject, validationObject)
    }

    /**
     *
     * @template R
     * @param {*} someObject
     * @param {import("../ResourceConfig.js").ResourceConfig<R>} resourceConfig
     */
    static validateCreatePartial(someObject, resourceConfig) {
        const resourceKeys = new Set(Object.keys(someObject))
        const validationObject = Object.fromEntries(Object.entries(resourceConfig.onCreate).filter(
            ([k]) => resourceKeys.has(k)))
        return this.#validate(someObject, validationObject)
    }

    /**
     *
     * @template R
     * @param {JsonApiRequest} request
     * @param {import("../ResourceConfig.js").ResourceConfig<R>} resourceConfig
     * @returns
     */
    static validateSearch(request, resourceConfig) {
        return this.#validate(request.query, resourceConfig.searchParams)
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {import("../ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {"create" | "delete" | "find" | "search" | "update"} handlerRequest
     */
    static verifyRequest(request, resourceConfig, handlerRequest) {
        const type = request.routeParams.type
        if (!resourceConfig) {
            throw new JsonApiError({
                status: 404,
                code: "ENOTFOUND",
                title: "Resource not found",
                detail: `The requested resource "${type}" does not exist`
            })
        }

        if (!resourceConfig.handlers.ready) {
            throw new JsonApiError({
                status: 503,
                code: "EUNAVAILABLE",
                title: "Resource temporarily unavailable",
                detail: `The requested resource "${type}" is temporarily unavailable`
            })
        }

        // for crud operation support, we need skip over any ChainHandlers to check what the actual store supports
        let finalHandler = resourceConfig.handlers
        while ("otherHandler" in finalHandler && finalHandler.otherHandler) {
            finalHandler = finalHandler.otherHandler
        }

        if (!finalHandler[handlerRequest]) {
            throw new JsonApiError({
                status: 403,
                code: "EFORBIDDEN",
                title: "Resource not supported",
                detail: `The requested resource "${type}" does not support "${handlerRequest}"`
            })
        }
    }
}