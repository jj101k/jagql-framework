"use strict"

const tools = require("./tools.js")

/**
 *
 */
module.exports = class FilterHelper {
    /**
     * @readonly
     * @type {Record<string, (value: any, filter: string) => boolean}
     */
    static #filterFunctions = {
        ">": (attrValue, filterValue) => attrValue > filterValue,
        "<": (attrValue, filterValue) => attrValue < filterValue,
        "~": (attrValue, filterValue) => attrValue.toLowerCase() === filterValue.toLowerCase(),
        ":": (attrValue, filterValue) => attrValue.toLowerCase().includes(filterValue.toLowerCase())
    }

    /**
     *
     * @param {*} a
     * @param {*} b
     * @returns
     */
    static #isEqual(a, b) {
        if(Array.isArray(a) != Array.isArray(b)) {
            return false
        }
        if((typeof a) != (typeof b)) {
            return false
        }
        if(Array.isArray(a)) {
            return a.length == b.length && a.every((_, i) => this.#isEqual(a[i], b[i]))
        } else if(typeof a == "object") {
            const aKeys = Object.keys(a)
            const bKeys = Object.keys(b)
            if(aKeys.length != bKeys.length) {
                return false
            }
            return aKeys.every(k => this.#isEqual(a[k], b[k]))
        } else {
            return a === b
        }
    }

    /**
     *
     * @param {import("../types/Filter.js").FilterSpec} filterElement
     * @param {*} attributeValue
     * @returns
     */
    static #filterMatches(filterElement, attributeValue) {
        if (!filterElement.operator) {
            return this.#isEqual(attributeValue, filterElement.value)
        }
        return this.#filterFunctions[filterElement.operator](attributeValue,
            filterElement.value)
    }

    /**
     * Returns true if the value matches any of the conditions
     *
     * @param {*} attributeValue
     * @param {Set<string>} allowListSimple
     * @param {import("../types/Filter.js").FilterSpec[]} allowListComplex
     * @returns
     */
    static #attributesMatchesOR(attributeValue, allowListSimple, allowListComplex) {
        if(allowListSimple.has(attributeValue)) {
            return true
        }
        return allowListComplex.some(filterElement => this.#filterMatches(filterElement, attributeValue))
    }

    /**
     * Returns true if the relationship matches any of the supplied IDs
     *
     * @param {import("../types/JsonApiResponse.js").JsonApiRelationshipObject} relationships
     * @param {Set<string>} allowListSimple
     * @returns
     */
    static #relationshipMatchesOR(relationships, allowListSimple) {
        const relOrRels = relationships.data

        const rels = tools.ensureArrayNotNullish(relOrRels)

        const relIds = rels.map(relationship => relationship.id)

        return relIds.some(id => allowListSimple.has(id))
    }

    /**
     *
     * @param {any} someObject
     * @param {Record<string, import("../types/Filter.js").FilterSpec[]>} filters
     * @param {Set<string>} relationships
     * @returns
     */
    static filterKeepInternalObject(someObject, filters, relationships) {
        for (const [prop, allowList] of Object.entries(filters)) {
            if(!someObject) {
                return false
            }
            const allowListSimple = new Set(allowList.filter(a => !a.operator).map(a => a.value))

            const allowListComplex = allowList.filter(a => a.operator)
            if (prop in someObject) {
                const propValue = someObject[prop]
                if(relationships.has(prop)) {
                    if(!this.#relationshipMatchesOR({data: propValue}, allowListSimple)) {
                        return false
                    }
                } else {
                    if(!this.#attributesMatchesOR(propValue, allowListSimple, allowListComplex)) {
                        return false
                    }
                }
            } else {
                // It doesn't exist at all
                return false
            }
        }
        return true
    }
}