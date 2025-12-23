'use strict'
import { swaggerPaths } from "./paths.js"
import { swaggerResources } from "./resources.js"

/**
 * @typedef {import("../ConfigStore.js").ConfigStore} ConfigStore
 */

/**
 *
 */
export class swaggerGenerator {
    /**
     * This should be called not more than once per service instance.
     *
     * @param {ConfigStore} configStore
     * @param {string | null} inferredBaseUrl
     * @param {Record<string, import("../../types/ResourceConfig.js").ResourceConfig<any>>} resources
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     * @returns The OpenAPI documentation
     */
    static generateDocumentation(configStore, inferredBaseUrl, resources, relationshipStore, joi) {
        const swaggerDoc = this.#getSwaggerBase(configStore, inferredBaseUrl)
        swaggerDoc.paths = swaggerPaths.getPathDefinitions(resources, relationshipStore, joi)
        swaggerDoc.definitions = swaggerResources.getResourceDefinitions(resources, relationshipStore)
        return swaggerDoc
    }

    /**
     *
     * @param {ConfigStore} configStore
     * @param {string | null} inferredBaseUrl
     * @returns
     */
    static #getSwaggerBase(configStore, inferredBaseUrl) {
        const swaggerConfig = configStore.config.swagger || { }
        const {basePath, host, protocol} = this.#getExternalUrlComponents(
            configStore, inferredBaseUrl)
        return {
            swagger: '2.0',
            info: {
                title: swaggerConfig.title,
                version: swaggerConfig.version,
                description: swaggerConfig.description,
                termsOfService: swaggerConfig.termsOfService,
                contact: {
                    name: swaggerConfig.contact?.name,
                    email: swaggerConfig.contact?.email,
                    url: swaggerConfig.contact?.url
                },
                license: {
                    name: swaggerConfig.license?.name,
                    url: swaggerConfig.license?.url
                }
            },
            host,
            basePath,
            schemes: [ protocol ],
            consumes: [
                'application/vnd.api+json'
            ],
            produces: [
                'application/vnd.api+json'
            ],
            parameters: {
                sort: {
                    name: 'sort',
                    in: 'query',
                    description: 'Sort resources as per the JSON:API specification',
                    required: false,
                    type: 'string'
                },
                include: {
                    name: 'include',
                    in: 'query',
                    description: 'Fetch additional resources as per the JSON:API specification',
                    required: false,
                    type: 'string'
                },
                filter: {
                    name: 'filter',
                    in: 'query',
                    description: 'Filter resources as per the JSON:API specification',
                    required: false,
                    type: 'string'
                },
                fields: {
                    name: 'fields',
                    in: 'query',
                    description: 'Limit response payloads as per the JSON:API specification',
                    required: false,
                    type: 'string'
                },
                page: {
                    name: 'page',
                    in: 'query',
                    description: 'Pagination namespace',
                    required: false,
                    type: 'string'
                }
            },
            paths: { },
            definitions: { },
            security: swaggerConfig.security || [ ],
            securityDefinitions: swaggerConfig.securityDefinitions || { }
        }
    }

    /**
     *
     * @param {ConfigStore} configStore
     * @param {string | null} inferredBaseUrl
     * @returns
     */
    static #getExternalUrlComponents(configStore, inferredBaseUrl) {
        if (inferredBaseUrl) {
            // Since it's from a header, we don't actually trust it to be a valid URL
            const md = inferredBaseUrl.match(
                /^(?<protocol>\w+):\/\/(?<hostname>(?:[\w-]+[.])*\w+)(?<path>\/.*)$/)
            if (md?.groups) {
                return {
                    basePath: md.groups.path.replace(/(?!^\/)\/$/, ''),
                    host: md.groups.hostname,
                    protocol: md.groups.protocol
                }
            }
        }
        const config = configStore.config
        if (config.urlPrefixAlias) {
            const urlObj = new URL(config.urlPrefixAlias)
            return {
                basePath: urlObj.pathname.replace(/(?!^\/)\/$/, ''),
                host: urlObj.host,
                protocol: urlObj.protocol.replace(/:$/, '')
            }
        } else {
            return {
                basePath: config.base.replace(/\/$/, ""),
                host: config.host,
                protocol: config.protocol
            }
        }
    }
}

