'use strict'

const jsonApiResources = require('../jsonApiResources.js')
const tools = require('../tools.js')
const Prop = require('../Prop.js')

/**
 *
 */
module.exports = class fields {
    /**
     *
     * @param {import('../../types/Handler.js').JsonApiRequest} request
     * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
     * @param {() => any} callback
     * @returns
     */
    static action(request, response, callback) {
        const resourceList = request.params.fields
        if (!resourceList || !(resourceList instanceof Object)) return callback()

        const allDataItems = [...response.included, ...tools.ensureArrayNotNullish(response.data)]

        const fields = {}
        for (const resource in resourceList) {
            if (!jsonApiResources[resource]) {
                return callback({
                    status: '403',
                    code: 'EFORBIDDEN',
                    title: 'Invalid field resource',
                    detail: `${resource} is not a valid resource `
                })
            }

            fields[resource] = new Set((`${resourceList[resource]}`).split(','))

            for (const j of fields[resource]) {
                if (!Prop.hasProperty(jsonApiResources[resource], j)) {
                    return callback({
                        status: '403',
                        code: 'EFORBIDDEN',
                        title: 'Invalid field selection',
                        detail: `${resource} do not have property ${j}`
                    })
                }
            }
        }

        for (const dataItem of allDataItems) {
            for (const attribute of Object.keys(dataItem.attributes)) {
                if (fields[dataItem.type] && !fields[dataItem.type].has(attribute)) {
                    delete dataItem.attributes[attribute]
                }
            }
        }

        return callback()
    }
}