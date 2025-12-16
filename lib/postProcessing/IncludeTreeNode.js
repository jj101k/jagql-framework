import { Prop } from "../Prop.js"
import { debug } from "../debug.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { rerouter } from "../rerouter.js"
import { tools } from "../tools.js"

/**
 * @typedef {import("../../types/ResourceConfig.js").ResourceConfig} ResourceConfig
 */

/**
 *
 */
export class IncludeTreeNode {
    /**
     * @readonly
     * @type {Record<string, IncludeTreeNode>}
     */
    #children = {}

    /**
     *
     */
    #configStore

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
     * @type {Record<string, ResourceConfig>}
     */
    #resourceConfig

    /**
     *
     */
    #router

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
     * @param {import("../Router.js").Router} router
     * @param {import("../ConfigStore.js").ConfigStore} configStore
     * @param {ResourceConfig | ResourceConfig[]} resourceConfigOrConfigs
     */
    constructor(router, configStore, resourceConfigOrConfigs) {
        this.#configStore = configStore
        this.#resourceConfig = Object.fromEntries(
            [...tools.ensureArray(resourceConfigOrConfigs)].map(r => [r.resource, r]))
        this.#router = router
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
     * @param {import("../../types/JsonApiRequest.js").JsonApiRequest} request
     * @param {number} [limit]
     */
    async initialise(request, limit = Math.pow(2, 32)) {
        const configStore = this.#configStore
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

        const config = configStore.config
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
            let nestedIncludesStripped
            if(child.#resourceConfig) {
                // Strip them down.
                const rc = child.#resourceConfig[resource]
                if(!rc) {
                    throw new Error(`Internal error: resource ${resource} is not identifiable on relation ${relationship}`)
                }
                nestedIncludesStripped = new Set(Object.keys(rc.attributes).filter(k => nestedIncludes.has(k)))
            } else {
                nestedIncludesStripped = nestedIncludes
            }
            if (nestedIncludesStripped.size) {
                query += `&include=${[...nestedIncludesStripped].join(",")}`
            }
            resourcesToFetch.push({
                url: `${config.base + resource}/?${query}`,
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
            let nestedIncludesStripped
            if(child.#resourceConfig) {
                // Strip them down.
                const rc = child.#resourceConfig[resource]
                if(!rc) {
                    throw new Error(`Internal error: resource ${resource} is not identifiable on relation ${relationship}`)
                }
                nestedIncludesStripped = new Set(Object.keys(rc.attributes).filter(k => nestedIncludes.has(k)))
            } else {
                nestedIncludesStripped = nestedIncludes
            }
            if (nestedIncludesStripped.size) {
                query += `&include=${[...nestedIncludesStripped].join(",")}`
            }
            resourcesToFetch.push({
                url: `${config.base + resource}/?${query}`,
                as: relationshipSpec
            })
        }
        let dropped = 0
        let added = 0

        for (const related of resourcesToFetch) {
            const parts = related.as.split('~~')
            debug.include(related)

            /**
             * @type {import("../../types/JsonApiResponse.js").JsonApiResponseBodyWithMeta}
             */
            let body
            try {
                body = await rerouter.route(this.#router, {
                    method: 'GET',
                    uri: related.url,
                    originalRequest: request,
                    query: {
                        page: { offset: 0, limit }
                    },
                })
            } catch (err) {
                debug.include('!!', JSON.stringify(err))
                throw err
            }

            const data = tools.ensureArrayNotNullish(body.data)
            const pageMetadata = body.meta?.page
            if(pageMetadata) {
                dropped += pageMetadata.total - data.length
            }
            limit -= data.length
            // Presume that this is within the limit
            added += data.length
            this.#children[parts[2]].addDataItems(...data)
        }
        for (const include of includes) {
            const {dropped: childDropped, added: childAdded} = await this.#children[include].initialise(request, limit)
            dropped += childDropped
            // Presume that this is within the limit
            added += childAdded
            limit -= childAdded
        }
        return {dropped, added}
    }
}