'use strict'
const ConfigStore = require('../ConfigStore.js')
const swaggerPaths = require('./paths.js')
const swaggerResources = require('./resources.js')

/**
 *
 */
module.exports = class swagger {
    /**
     * This should be called not more than once per service instance.
     *
     * @param {string | null} inferredBaseUrl
     * @returns The OpenAPI documentation
     */
    static generateDocumentation(inferredBaseUrl) {
        const swaggerDoc = this.#getSwaggerBase(inferredBaseUrl)
        swaggerDoc.paths = swaggerPaths.getPathDefinitions()
        swaggerDoc.definitions = swaggerResources.getResourceDefinitions()
        return swaggerDoc
    }

    /**
     *
     * @param {string | null} inferredBaseUrl
     * @returns
     */
    static #getSwaggerBase(inferredBaseUrl) {
        const swaggerConfig = ConfigStore.config.swagger || { }
        const {basePath, host, protocol} = this.#getExternalUrlComponents(
            inferredBaseUrl)
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
     * @param {string | null} inferredBaseUrl
     * @returns
     */
    static #getExternalUrlComponents(inferredBaseUrl) {
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
        const config = ConfigStore.config
        if (config.urlPrefixAlias) {
            const urlObj = new URL(config.urlPrefixAlias)
            return {
                basePath: urlObj.pathname.replace(/(?!^\/)\/$/, ''),
                host: urlObj.host,
                protocol: urlObj.protocol.replace(/:$/, '')
            }
        } else {
            return {
                host: config.host,
                basePath: config.base.substring(0, config.base.length - 1),
                protocol: config.protocol
            }
        }
    }
}

