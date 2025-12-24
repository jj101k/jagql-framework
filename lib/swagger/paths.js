'use strict'
import { Prop } from "../Prop.js"
import { Relationship } from "../Relationship.js"
import { RemoteRelationship } from "../RemoteRelationship.js"

/**
 * @typedef {Partial<Record<"get" | "post" | "put" | "delete" | "patch", any>>} PathSchema
 * @typedef {import("../ResourceConfig.js").ResourceConfig} ResourceConfig
 * @typedef {import("@scalar/openapi-types").OpenAPIV3_2.ParameterObject |
 * import("@scalar/openapi-types").OpenAPIV3_2.ReferenceObject} OptOpenAPIParameterObject
 */

/**
 * Compat: Joi 17
 */
export class swaggerPaths {
    /**
     * This should be called only once per service instance.
     *
     * @param {Record<string, import("../ResourceConfig.js").ResourceConfig<any>>} resources
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     * @returns The OpenAPI spec for path handlers
     */
    static getPathDefinitions(resources, relationshipStore, joi) {
        /**
         * @type {Record<string, PathSchema>}
         */
        const paths = { }

        for (const resourceName in resources) {
            const resourceConfig = resources[resourceName]
            this.#addPathDefinition(paths, resourceConfig, resources, relationshipStore, joi)
        }

        return paths
    }

    /**
     * This should be called once per resource, once per service instance.
     *
     * This will update `paths`.
     *
     * @param {Record<string, PathSchema>} paths
     * @param {ResourceConfig} resourceConfig
     * @param {Record<string, import("../ResourceConfig.js").ResourceConfig<any>>} resources
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     */
    static #addPathDefinition(paths, resourceConfig, resources, relationshipStore, joi) {
        if (!paths || !resourceConfig) return undefined
        const resourceName = resourceConfig.resource

        this.#addBasicPaths(paths, resourceName, resourceConfig)

        for(const [relationshipName, rel] of Relationship.getAllRelationships(resourceConfig, relationshipStore)) {
            // Remote relationships are not actually handled here - see lib/routes/related.js
            if (RemoteRelationship.isRemoteRelationship(rel)) continue
            /**
             * @type {string}
             */
            const relTypeName = rel.resourceNames[0]
            if(!resources[relTypeName]?.handlers.find) {
                continue
            }
            this.#addDeepPaths(paths, resourceName, resourceConfig, relationshipName, relTypeName, relationshipStore)
        }
        for(const actionName in resourceConfig.actions) {
            this.#addActionPath(paths, resourceName, actionName, resourceConfig, joi)
        }
    }

    /**
     * This should be called once per resource-action, once per service instance.
     *
     * This will update `paths`.
     *
     * @param {Record<string, PathSchema>} paths
     * @param {string} resourceName
     * @param {string} actionName
     * @param {ResourceConfig} resourceConfig
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     */
    static #addActionPath(paths, resourceName, actionName, resourceConfig, joi) {
        const actionPaths = { }
        const actionConfig = resourceConfig.actions[actionName]
        paths[`/${resourceName}/{id}/${actionName}`] = actionPaths
        if (actionConfig.get) {
            actionPaths.get = this.#getActionObject({
                resourceName,
                description: `Action ${actionName} GET on ${resourceName}`,
                hasPathId: true,
                parameters: actionConfig.params
            }, joi)
        }
        if (actionConfig.post) {
            actionPaths.post = this.#getActionObject({
                resourceName,
                description: `Action ${actionName} POST on ${resourceName}`,
                hasPathId: true,
                parameters: actionConfig.params
            }, joi)
        }
    }

    /**
     * This should be called once per resource, once per service instance.
     *
     * This will update `paths`.
     *
     * @param {Record<string, PathSchema>} paths
     * @param {string} resourceName
     * @param {ResourceConfig} resourceConfig
     */
    static #addBasicPaths(paths, resourceName, resourceConfig) {
        const genericPaths = { }
        const specificPaths = { }
        paths[`/${resourceName}`] = genericPaths
        paths[`/${resourceName}/{id}`] = specificPaths

        if (resourceConfig.handlers.search) {
            genericPaths.get = this.#getPathOperationObject({
                handler: 'search',
                resourceName,
                description: `Search for ${resourceName}`,
                parameters: resourceConfig.searchParams,
                hasPathId: false
            })
        }

        if (resourceConfig.handlers.create) {
            genericPaths.post = this.#getPathOperationObject({
                handler: 'create',
                resourceName,
                description: `Create a new instance of ${resourceName}`,
                parameters: Prop.getAllSchemas(resourceConfig),
                hasPathId: false
            })
        }

        if (resourceConfig.handlers.find) {
            specificPaths.get = this.#getPathOperationObject({
                handler: 'find',
                resourceName,
                description: `Get a specific instance of ${resourceName}`,
                hasPathId: true
            })
        }

        if (resourceConfig.handlers.delete) {
            specificPaths.delete = this.#getPathOperationObject({
                handler: 'delete',
                resourceName,
                description: `Delete an instance of ${resourceName}`,
                hasPathId: true
            })
        }

        if (resourceConfig.handlers.update) {
            specificPaths.patch = this.#getPathOperationObject({
                handler: 'update',
                resourceName,
                description: `Update an instance of ${resourceName}`,
                hasPathId: true
            })
        }
    }

    /**
     * Adds paths for a relationship
     *
     * This should be called once per resource-relationship, once per service instance.
     *
     * This will update `paths`.
     *
     * @param {Record<string, PathSchema>} paths
     * @param {string} resourceName
     * @param {ResourceConfig} resourceConfig
     * @param {string} relationshipName
     * @param {string} relationship
     * @param {import("../RelationshipStore.js").RelationshipStore} relationshipStore
     */
    static #addDeepPaths(paths, resourceName, resourceConfig, relationshipName, relationship, relationshipStore) {
        const rel = Relationship.getRelationship(resourceConfig, relationshipName, relationshipStore)
        const relationshipType = rel.count

        if (resourceConfig.handlers.find) {
            paths[`/${resourceName}/{id}/${relationshipName}`] = {
                get: this.#getPathOperationObject({
                    handler: 'find',
                    description: `Get the ${relationshipName} instance${relationshipType === 'many' ? 's' : ''} of a specific instance of ${resourceName}`,
                    resourceName: relationship,
                    hasPathId: true
                })
            }
        }

        const relationshipPaths = { }
        paths[`/${resourceName}/{id}/relationships/${relationshipName}`] = relationshipPaths
        const description = `the ${relationshipName} relationship of a specific instance of ${resourceName}`

        if (resourceConfig.handlers.find) {
            relationshipPaths.get = this.#getPathOperationObject({
                description: `Get ${description}`,
                handler: 'find',
                resourceName: relationship,
                relationshipType: relationshipType,
                extraTags: resourceName,
                hasPathId: true
            })
        }

        if (resourceConfig.handlers.update) {
            relationshipPaths.post = this.#getPathOperationObject({
                description: `Create ${description}`,
                handler: 'create',
                resourceName: relationship,
                relationshipType: relationshipType,
                extraTags: resourceName,
                hasPathId: true
            })
        }

        if (resourceConfig.handlers.update) {
            relationshipPaths.patch = this.#getPathOperationObject({
                description: `Update ${description}`,
                handler: 'update',
                resourceName: relationship,
                relationshipType: relationshipType,
                extraTags: resourceName,
                hasPathId: true
            })
        }

        if (resourceConfig.handlers.update) {
            relationshipPaths.delete = this.#getPathOperationObject({
                description: `Delete ${description}`,
                handler: 'delete',
                resourceName: relationship,
                relationshipType: relationshipType,
                extraTags: resourceName,
                hasPathId: true
            })
        }
    }

    /**
     * This should be called 1-2 times per resource-action, once per service instance.
     *
     * @param {{action?: string, description: string, hasPathId: boolean, parameters: Record<string, import("joi").Schema>, resourceName: string}} options
     * @param {ReturnType<(typeof import("../ourJoi.js").ourJoi)["build"]>} joi
     * @returns
     */
    static #getActionObject(options, joi) {
        const actionDefinition = {
            tags: [ options.resourceName ],
            description: options.description,
            parameters: [ ],
            responses: {
                '200': {
                    description: `${options.resourceName} ${options.action} response`,
                    schema: {
                        type: 'object',
                        required: [ 'jsonapi', 'meta', 'links' ],
                        properties: {
                            jsonapi: {
                                type: 'object',
                                required: [ 'version' ],
                                properties: {
                                    version: {
                                        type: 'string'
                                    }
                                }
                            },
                            meta: {
                                type: 'object'
                            }
                        }
                    }
                },
                default: {
                    description: 'Unexpected error',
                    schema: {
                        '$ref': '#/definitions/error'
                    }
                }
            }
        }
        if (options.hasPathId) {
            actionDefinition.parameters.push({
                name: 'id',
                in: 'path',
                description: 'id of specific instance to lookup',
                required: true,
                type: 'string'
            })
        }
        if (options.parameters) {
            const additionalParams = Object.keys(options.parameters).map(paramName => {
                if ((paramName === 'id') || (paramName === 'type')) return null
                const optSchemaDef = options.parameters[paramName]
                const optSchema = joi.compile(optSchemaDef)

                const describe = optSchema.describe()
                return {
                    name: paramName,
                    in: 'query',
                    description: describe.description || undefined,
                    required: describe.flags?.presence === 'required',
                    type: describe.type
                }
            })
            actionDefinition.parameters.push(...additionalParams)
        }
        return actionDefinition
    }

    /**
     * This should be called a small number of times per resource, once per service instance.
     *
     * @param {{description: string, extraTags?: string, handler: string, hasPathId: boolean, parameters?: Record<string, import("joi").Schema>, relationshipType?: "many" | "one", resourceName: string}} options
     * @returns
     */
    static #getPathOperationObject(options) {
        const getResponseData = () => {
            if (options.relationshipType) {
                const relationshipModel = this.#getRelationshipModel()
                if (options.relationshipType === "many") {
                    return {
                        type: "array",
                        items: relationshipModel
                    }
                } else {
                    return relationshipModel
                }
            }
            const refItem = {
                $ref: `#/definitions/${options.resourceName}`
            }
            switch(options.handler) {
                case "search": {
                    return {
                        type: "array",
                        items: refItem
                    }
                }
                case "find": {
                    return refItem
                }
                case "delete": {
                    return undefined
                }
            }
            return refItem
        }

        const getParameters = () => {

            /**
             *
             * @returns {OptOpenAPIParameterObject[]}
             */
            const getHandlerParameters = () => {
                switch(options.handler) {
                    case "find": // Fall through
                    case "search": {
                        return this.#optionalJsonApiParameters()
                    }
                    case "create": // Fall through
                    case "update": {
                        const body = this.#getBaseResourceModel(options.resourceName)
                        if (options.relationshipType) {
                            body.schema.properties.data = this.#getRelationshipModel()
                            if ((options.handler === 'update') && (options.relationshipType === 'many')) {
                                body.schema.properties.data = {
                                    type: 'array',
                                    items: body.schema.properties.data
                                }
                            }
                        }
                        return [body]
                    }
                    case "delete": {
                        if (options.relationshipType) {
                            const body2 = this.#getBaseResourceModel(options.resourceName)
                            body2.schema.properties.data = this.#getRelationshipModel()
                            return [body2]
                        }
                    }
                }
                return []
            }

            const parameters = [...getHandlerParameters()]

            if (options.hasPathId) {
                parameters.push({
                    name: 'id',
                    in: 'path',
                    description: 'id of specific instance to lookup',
                    required: true,
                    type: 'string'
                })
            }

            if (options.parameters) {
                for(const paramName of Object.keys(options.parameters)) {
                    if ((paramName === 'id') || (paramName === 'type')) continue
                    const optSchema = options.parameters[paramName]
                    const describe = optSchema.describe()

                    parameters.push({
                        name: paramName,
                        in: 'query',
                        description: describe.description || undefined,
                        required: describe.flags?.presence === 'required',
                        type: describe.type,
                    })
                }
            }

            return parameters
        }

        const extraTags = options.extraTags ?? []
        const successCode = options.handler === 'create' ? 201 : 200
        const pathDefinition = {
            tags: [ ...new Set([options.resourceName, ...extraTags]) ],
            description: options.description,
            parameters: getParameters(),
            responses: {
                [successCode]: {
                    description: `${options.resourceName} ${options.handler} response`,
                    schema: {
                        type: 'object',
                        required: [ 'jsonapi', 'meta', 'links' ],
                        properties: {
                            jsonapi: {
                                type: 'object',
                                required: [ 'version' ],
                                properties: {
                                    version: {
                                        type: 'string'
                                    }
                                }
                            },
                            meta: {
                                type: 'object'
                            },
                            links: {
                                type: 'object',
                                required: [ 'self' ],
                                properties: {
                                    self: {
                                        type: 'string'
                                    },
                                    first: {
                                        type: 'string'
                                    },
                                    last: {
                                        type: 'string'
                                    },
                                    next: {
                                        type: 'string'
                                    },
                                    prev: {
                                        type: 'string'
                                    }
                                }
                            },
                            data: getResponseData(),
                        },
                    }
                },
                default: {
                    description: 'Unexpected error',
                    schema: {
                        '$ref': '#/definitions/error'
                    }
                }
            }
        }

        if (
            (options.handler === "search" || options.handler === "find") &&
            !options.relationship
        ) {
            pathDefinition.responses[successCode].schema.properties.included = {
                type: 'array',
                items: {
                    type: 'object'
                }
            }
        }

        return pathDefinition
    }

    /**
     *
     * @returns {OptOpenAPIParameterObject[]}
     */
    static #optionalJsonApiParameters() {
        return [
            { '$ref': '#/parameters/sort' },
            { '$ref': '#/parameters/include' },
            { '$ref': '#/parameters/filter' },
            { '$ref': '#/parameters/fields' },
            { '$ref': '#/parameters/page' }
        ]
    }

    /**
     *
     * @returns {import("json-schema").JSONSchema7}
     */
    static #getRelationshipModel() {
        return {
            type: 'object',
            required: [ 'type', 'id' ],

            properties: {
                type: {
                    type: 'string'
                },
                id: {
                    type: 'string'
                },
                meta: {
                    type: 'object'
                }
            }
        }
    }

    /**
     * Returns the param for a message body to create/update a resource
     *
     * @param {string} resourceName
     * @returns
     */
    static #getBaseResourceModel(resourceName) {
        return {
            in: "body",
            name: "body",
            description: "New or partial resource",
            required: true,
            /**
             * @type {import("json-schema").JSONSchema7}
             */
            schema: {
                type: "object",
                properties: {
                    data: {
                        $ref: `#/definitions/${resourceName}`
                    }
                }
            }
        }
    }
}
