"use strict"

import { DummyFilterHelper } from "./DummyFilterHelper.js"
import { Relationship } from "./Relationship.js"
import { tools } from "./tools.js"

/**
 * @template R
 */
export class FilterHelper {
    /**
     * @readonly
     * @type {Record<string, (value: any, filter: string) => boolean>}
     */
    #filterFunctions = {
        ">": (attrValue, filterValue) => attrValue > filterValue,
        "<": (attrValue, filterValue) => attrValue < filterValue,
        "~": (attrValue, filterValue) => attrValue.toLowerCase() === filterValue.toLowerCase(),
        ":": (attrValue, filterValue) => attrValue.toLowerCase().includes(filterValue.toLowerCase())
    }

    /**
     *
     * @param {*} a
     * @param {*} b
     * @returns {boolean}
     */
    #isEqual(a, b) {
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
     * @param {import("./Filter.js").FilterSpec} filterElement
     * @param {*} attributeValue
     * @returns
     */
    #filterMatches(filterElement, attributeValue) {
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
     * @param {import("./Filter.js").FilterSpec[]} allowListComplex
     * @returns
     */
    #attributesMatchesOR(attributeValue, allowListSimple, allowListComplex) {
        if(allowListSimple.has(attributeValue)) {
            return true
        }
        return allowListComplex.some(filterElement => this.#filterMatches(filterElement, attributeValue))
    }

    /**
     * Returns true if the relationship matches any of the supplied IDs
     *
     * @param {import("./JsonApiResponse.js").JsonApiRelationshipObject["data"]} relationships
     * @param {Set<string>} allowListSimple
     * @returns
     */
    #relationshipMatchesOR(relationships, allowListSimple) {
        const rels = tools.ensureArrayNotNullish(relationships)

        const relIds = rels.map(relationship => relationship.id)

        return relIds.some(id => allowListSimple.has(id))
    }

    /**
     *
     * @param {any} someObject
     * @returns
     */
    #filterKeepInternalObject(someObject) {
        for (const [prop, allowList] of Object.entries(this.#processedFilter)) {
            if(!someObject) {
                return false
            }
            const allowListSimple = new Set(allowList.filter(a => !a.operator).map(a => a.value))

            const allowListComplex = allowList.filter(a => a.operator)
            if (prop in someObject) {
                const propValue = someObject[prop]
                if(this.#relationships.has(prop)) {
                    if(!this.#relationshipMatchesOR(propValue, allowListSimple)) {
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

    /**
     *
     */
    #processedFilter

    /**
     * @type {Set<string>}
     */
    #relationships

    /**
     *
     * @template R
     * @param {import("./handlers/PromiseHandler.js").PromiseHandler<R> | import("./promisifyHandler.js")<R>} handler
     * @param {import("./JsonApiRequest.js").JsonApiRequest} request
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static getHelper(handler, request, resourceConfig, relationshipStore) {
        if(handler.handlesFilter || !request.processedFilter) {
            return new DummyFilterHelper()
        } else {
            return new FilterHelper(request.processedFilter, resourceConfig, relationshipStore)
        }
    }

    /**
     *
     * @param {Record<string, import("./Filter.js").FilterSpec[]>} processedFilter
     * @param {import("./ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {import("./RelationshipStore.js").RelationshipStore} relationshipStore
     */
    constructor(processedFilter, resourceConfig, relationshipStore) {
        this.#processedFilter = processedFilter
        this.#relationships = new Set(Relationship.getAllRelationships(resourceConfig, relationshipStore).map(([r]) => r))
    }

    /**
     *
     * @param {R[]} r
     * @param {number} t
     * @returns {[R[], number]}
     */
    filter(r, t) {
        const results = r.filter(ri => this.#filterKeepInternalObject(ri))
        return [results, t - r.length + results.length]
    }
}