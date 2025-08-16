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
     * @param {JsonApiRequest} request
     * @param {import('../../types/JsonApiResponse.js').JsonApiResponseBodyWithMeta} response
     * @returns
     */
    static action(request, response) {
        const resourceList = request.params.fields
        if (!resourceList || !(resourceList instanceof Object)) return

        const allDataItems = [...response.included, ...tools.ensureArrayNotNullish(response.data)]

        const fields = {}
        for (const resource in resourceList) {
            if (!jsonApiResources[resource]) {
                throw {
                    status: '403',
                    code: 'EFORBIDDEN',
                    title: 'Invalid field resource',
                    detail: `${resource} is not a valid resource `
                }
            }

            fields[resource] = new Set((`${resourceList[resource]}`).split(','))

            for (const j of fields[resource]) {
                if (!Prop.hasProperty(jsonApiResources[resource], j)) {
                    throw {
                        status: '403',
                        code: 'EFORBIDDEN',
                        title: 'Invalid field selection',
                        detail: `${resource} do not have property ${j}`
                    }
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
    }
}