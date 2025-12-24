'use strict'

import { Prop } from "../Prop.js"
import { JsonApiError } from "../errorHandlers/JsonApiError.js"
import { tools } from "../tools.js"

/**
 *
 */
export class fields {
    /**
     *
     * @param {import("../JsonApiRequest.js").JsonApiRequest} request
     * @param {import("../JsonApiResponse.js").JsonApiResponseBodyWithMeta} response
     * @param {Record<string, import("../ResourceConfig.js").ResourceConfig<any>>} resources
     * @returns
     */
    static action(request, response, resources) {
        const resourceList = request.query.fields
        if (!resourceList || !(resourceList instanceof Object)) return

        const allDataItems = [...response.included, ...tools.ensureArrayNotNullish(response.data)]

        const fields = {}
        for (const resource in resourceList) {
            if (!resources[resource]) {
                throw new JsonApiError({
                    status: 403,
                    code: 'EFORBIDDEN',
                    title: 'Invalid field resource',
                    detail: `${resource} is not a valid resource `
                })
            }

            fields[resource] = new Set((`${resourceList[resource]}`).split(','))

            for (const j of fields[resource]) {
                if (!Prop.hasProperty(resources[resource], j)) {
                    throw new JsonApiError({
                        status: 403,
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
    }
}