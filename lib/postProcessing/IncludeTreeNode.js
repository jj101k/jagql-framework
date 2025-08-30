const tools = require("../tools")
const debug = require('../debugging.js')
const jsonApiConfig = require('../jsonApiConfig.js')
const rerouter = require('../rerouter.js')
const { JsonApiError } = require("../errorHandlers/JsonApiError")
const Prop = require("../Prop")

/**
 *
 */
class IncludeTreeNode {
    /**
     * @readonly
     * @type {Record<string, IncludeTreeNode>}
     */
    #children = {}

    /**
     * @type {any[] | null}
     */
    #dataItems = null

    /**
     * @type {string[]}
     */
    #filters = []

    /**
     * @readonly
     * @type {Record<string, import("../../types/ResourceConfig").ResourceConfig>}
     */
    #resourceConfig

    /**
     *
     */
    get #childKeys() {
        return new Set(Object.keys(this.#children))
    }

    /**
     *
     */
    get #childValues() {
        return Object.values(this.#children)
    }

    /**
     *
     * @param {string} resource
     */
    #applicableChildKeys(resource) {
        const nestedIncludes = this.#childKeys
        const rc = this.#resourceConfig[resource]
        if(!rc) {
            throw new Error(`Internal error: resource ${resource} does not exist`)
        }
        return new Set(Object.keys(rc.attributes).filter(k => nestedIncludes.has(k)))
    }

    /**
     *
     */
    get included() {
        if(!this.#dataItems) {
            return []
        }
        const items = [...this.#dataItems]
        for (const data of this.#childValues) {
            items.push(...data.included)
        }
        return items
    }

    /**
     *
     */
    get resourceTypes() {
        return Object.keys(this.#resourceConfig)
    }

    /**
     *
     * @param {import("../../types/ResourceConfig").ResourceConfig | import("../../types/ResourceConfig").ResourceConfig[]} resourceConfigOrConfigs
     */
    constructor(resourceConfigOrConfigs) {
        this.#resourceConfig = Object.fromEntries(
            [...tools.ensureArray(resourceConfigOrConfigs)].map(r => [r.resource, r]))
    }

    /**
     *
     * @param  {...any} items
     */
    addDataItems(...items) {
        this.#dataItems ??= []
        this.#dataItems.push(...items)
    }

    /**
     *
     * @param {string} name
     * @param {string} value
     */
    addFilter(name, value) {
        this.#filters.push(`filter[${encodeURIComponent(name)}]=${encodeURIComponent("" + value)}`)
    }

    /**
     *
     */
    clearDataItems() {
        this.#dataItems = []
    }

    /**
     *
     * @param {string} name
     * @param {() => IncludeTreeNode} add
     * @returns
     */
    ensureChild(name, add) {
        this.#children[name] ??= add()
        return this.#children[name]
    }

    /**
     *
     * @param {string} relationship
     * @returns
     */
    firstResourceWithRelationship(relationship) {
        return Object.values(this.#resourceConfig).find(
            resourceConfig => Prop.hasProperty(resourceConfig, relationship))
    }

    /**
     *
     * @param {import("../../types/JsonApiRequest").JsonApiRequest} request
     */
    async initialise(request) {
        this.#dataItems ??= []
        const includes = this.#childKeys

        const unseenIncludes = new Set(includes)
        for(const rc of Object.values(this.#resourceConfig)) {
            const remove = new Set()
            for(const i of unseenIncludes) {
                if(rc.attributes[i]) {
                    remove.add(i)
                }
            }
            for(const r of remove) {
                unseenIncludes.delete(r)
            }
            if(!unseenIncludes.size) {
                break
            }
        }

        if(unseenIncludes.size) {
            const relationship = [...unseenIncludes]
            throw new JsonApiError({
                status: 403,
                code: "EFORBIDDEN",
                title: "Invalid inclusion",
                detail: `${this.resourceTypes.join(" | ")} do not have property/properties ${relationship}`
            })
        }

        /**
         * @type {{primary: Record<string, string[]>, foreign: Record<string, string[]>}
         */
        const relationshipsToInclude = {
            primary: {},
            foreign: {}
        }

        for (const dataItem of this.#dataItems) {
            if (!dataItem?.relationships) continue
            const relationships = Object.keys(dataItem.relationships).filter(
                keyName => includes.has(keyName))
            for (const relationship of relationships) {
                const someRelationship = dataItem.relationships[relationship]

                if (someRelationship.meta.relation === 'primary') {
                    if (someRelationship.data === undefined) {
                        console.warn(`Relationship ${relationship} is missing from the response, skipping`)
                    }
                    const relationshipItems = tools.ensureArrayNotNullish(someRelationship.data)
                    for (const relationshipItem of relationshipItems) {
                        const key = `${relationshipItem.type}~~${relationship}~~${relationship}`
                        relationshipsToInclude.primary[key] ??= []
                        relationshipsToInclude.primary[key].push(relationshipItem.id)
                    }
                } else if (someRelationship.meta.relation === 'foreign') {
                    const key = `${someRelationship.meta.as}~~${someRelationship.meta.belongsTo}~~${relationship}`
                    relationshipsToInclude.foreign[key] ??= []
                    relationshipsToInclude.foreign[key].push(dataItem.id)
                }
            }
        }

        /**
         * @type {{url: string, as: string}[]}
         */
        const resourcesToFetch = []

        for (const relationshipSpec of Object.keys(relationshipsToInclude.primary)) {
            const ids = [...new Set(relationshipsToInclude.primary[relationshipSpec])]
            const [resource, relationship] = relationshipSpec.split('~~')
            let query = ids.map(id => `filter[id]=${id}`).join("&")
            const child = this.#children[relationship]
            if (child.#filters.length) {
                query += `&${child.#filters.join('&')}`
            }
            const nestedIncludes = child.#applicableChildKeys(resource)
            if (nestedIncludes.size) {
                query += `&include=${[...nestedIncludes].join(",")}`
            }
            resourcesToFetch.push({
                url: `${jsonApiConfig.base + resource}/?${query}`,
                as: relationshipSpec
            })
        }

        for (const relationshipSpec of Object.keys(relationshipsToInclude.foreign)) {
            const ids = [...new Set(relationshipsToInclude.foreign[relationshipSpec])]
            ids.sort((a, b) => a.localeCompare(b))
            const [parentField, resource, relationship] = relationshipSpec.split('~~')
            let query = ids.map(id => `filter[${parentField}]=${id}`).join("&")
            const child = this.#children[relationship]
            if (child.#filters.length) {
                query += `&${child.#filters.join('&')}`
            }
            const nestedIncludes = child.#applicableChildKeys(resource)
            if (nestedIncludes.size) {
                query += `&include=${[...nestedIncludes].join(",")}`
            }
            resourcesToFetch.push({
                url: `${jsonApiConfig.base + resource}/?${query}`,
                as: relationshipSpec
            })
        }

        for (const related of resourcesToFetch) {
            const parts = related.as.split('~~')
            debug.include(related)

            let body
            try {
                body = await rerouter.route({
                    method: 'GET',
                    uri: related.url,
                    originalRequest: request,
                    params: {
                        page: { offset: 0, limit: Math.pow(2, 32) } // Essentially no limit
                    }
                })
            } catch (err) {
                debug.include('!!', JSON.stringify(err))
                throw err
            }

            const data = tools.ensureArrayNotNullish(body.data)
            this.#children[parts[2]].addDataItems(...data)
        }
        for (const include of includes) {
            await this.#children[include].initialise(request)
        }
    }
}

module.exports = { IncludeTreeNode }