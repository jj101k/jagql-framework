"use strict"

const Attribute = require("./Attribute")
const { JsonApiError } = require("./errorHandlers/JsonApiError")
const Prop = require("./Prop")
const Relationship = require("./Relationship")
const RemoteRelationship = require("./RemoteRelationship")

/**
 * @typedef {import("../types/Filter").FilterSpec} FilterSpec
 */

/**
 * Single-character field prefix
 */
const FILTER_OPERATORS = new Set(["<", ">", "~", ":"])
/**
 * Single-character field prefix
 */
const STRING_ONLY_OPERATORS = new Set(["~", ":"])
const FILTER_SEPARATOR = ","

/**
 *
 */
module.exports = class RequestFilter {
    /**
     * If the filter definition looks valid, returns it; otherwise, returns an
     * error.
     *
     * This is called once per filter value, once per find/search request
     *
     * @param {string} attributeName
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string} scalarElement
     * @returns {{result: FilterSpec} | {error: string}}
     */
    static #parseFilterDef(attributeName, resourceConfig, scalarElement) {
        if (!scalarElement) return { error: "invalid or empty filter element" }

        const splitElement = this.#splitElement(scalarElement)
        if (!splitElement) return { error: "empty filter" }

        const operator = splitElement.operator
        const rel = Relationship.getRelationship(resourceConfig, attributeName)
        if (rel) {
            if (operator && STRING_ONLY_OPERATORS.has(operator)) {
                return { error: `operator ${operator} can only be applied to string attributes` }
            }
            return { result: splitElement } // relationship attribute: no further validation
        }
        const schema = Attribute.getAttribute(resourceConfig, attributeName)
        if (!schema) {
            throw new Error(`Internal error: ${attributeName} is neither a relationship nor an attribute`)
        }
        if (operator && STRING_ONLY_OPERATORS.has(operator)) {
            const desc = schema.describe()
            if (desc.type !== "string") {
                return { error: `operator ${operator} can only be applied to string attributes` }
            }
        }

        const validateResult = schema.validate(splitElement.value)
        if (validateResult.error) {
            return { error: validateResult.error.message }
        }

        return {
            result: {
                operator: splitElement.operator,
                value: validateResult.value
            }
        }
    }

    /**
     * This is called once per filter attribute, once per find/search request
     *
     * @param {string} attributeName
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string[]} filterDefs
     * @returns {{error: JsonApiError} | {result: FilterSpec[]}}
     */
    static #parseFilterDefs(attributeName, resourceConfig, filterDefs) {
        const helperResult =
            this.#parseFilterDefsHelper(attributeName, resourceConfig, filterDefs)

        if ("error" in helperResult) {
            return {
                error: new JsonApiError({
                    status: 403,
                    code: "EFORBIDDEN",
                    title: "Invalid filter",
                    detail: `Filter value for key "${attributeName}" is invalid: ${helperResult.error}`
                })
            }
        }
        return { result: helperResult.result }
    }

    /**
     * This is called once per filter attribute, once per find/search request
     *
     * @param {string} attributeName
     * @param {import("../types/ResourceConfig").ResourceConfig} resourceConfig
     * @param {string[]} filterDefs
     * @returns {{result: FilterSpec[]} | {error: string[]}}
     */
    static #parseFilterDefsHelper(attributeName, resourceConfig, filterDefs) {
        if (!filterDefs) return { error: ["invalid or empty filter element"] }

        const parsedDefs = filterDefs.map(
            filterDef => this.#parseFilterDef(attributeName, resourceConfig, filterDef))

        /**
         * @type {string[]}
         */
        const error = []
        /**
         * @type {FilterSpec[]}
         */
        const result = []
        for (const def of parsedDefs) {
            if ("error" in def) {
                error.push(def.error)
            } else {
                result.push(def.result)
            }
        }

        if (error.length) return { error }

        return { result }
    }

    /**
     * Filter values starting with any of <>~: become an operator-value pair.
     * Otherwise it's the plain value.
     *
     * @param {string} element
     * @returns {FilterSpec | null}
     */
    static #splitElement(element) {
        if (!element) return null
        if (FILTER_OPERATORS.has(element[0])) {
            return { operator: element[0], value: element.substring(1) }
        }
        return { operator: null, value: element }
    }

    /**
     * This is called once per find/search request
     *
     * @param {import("../types/JsonApiRequest").JsonApiRequest} request
     * @throws {import("../types/CallbackHandler").JsonApiError}
     */
    static parseAndValidate(request) {
        const filterIn = request.query.filter
        if (!filterIn) return

        const resourceConfig = request.resourceConfig
        if (Array.isArray(resourceConfig) || !resourceConfig) {
            throw new Error(`Internal error: invalid resource config`)
        }

        /**
         * @type {Record<string, FilterSpec[]>}
         */
        const processedFilter = {}

        const filterReformatted = Object.fromEntries(
            Object.entries(filterIn).map(([key, filterElement]) => {
                if (typeof filterElement == "string") {
                    filterElement = filterElement.split(FILTER_SEPARATOR)
                }
                return [key, filterElement]
            })
        )

        for (const [key, filterDefs] of Object.entries(filterReformatted)) {
            if (!Array.isArray(filterDefs) && filterDefs instanceof Object) continue // skip deep filters

            if (!Prop.hasProperty(resourceConfig, key)) {
                throw new JsonApiError({
                    status: 403,
                    code: "EFORBIDDEN",
                    title: "Invalid filter",
                    detail: `${resourceConfig.resource} do not have attribute or relationship "${key}"`
                })
            }

            const rel = Relationship.getRelationship(resourceConfig, key)
            if (RemoteRelationship.isRemoteRelationship(rel)) {
                throw new JsonApiError({
                    status: 403,
                    code: "EFORBIDDEN",
                    title: "Invalid filter",
                    detail: `Filter relationship "${key}" is a foreign reference and does not exist on ${resourceConfig.resource}`
                })
            }

            const parsedFilterElement = this.#parseFilterDefs(key,
                resourceConfig, filterDefs)
            if ("error" in parsedFilterElement) throw parsedFilterElement.error

            processedFilter[key] = [...parsedFilterElement.result]
        }

        // Compat only
        request.params.filter = filterReformatted

        request.processedFilter = processedFilter
    }
}

