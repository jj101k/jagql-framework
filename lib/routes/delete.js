'use strict'

import { PromisifyHandler } from "../promisifyHandler.js"
import { responseHelper } from "../responseHelper.js"
import { helper } from "./helper.js"

/**
 *
 */
export class deleteRoute {
    /**
     * @param {import("../Router.js").Router} router
     */
    static register(router) {
        router.bindRoute({
            verb: 'delete',
            path: ':type/:id'
        }, async (request, resourceConfig, res) => {
            const handler = PromisifyHandler.for(resourceConfig?.handlers)

            helper.verifyRequest(request, resourceConfig, 'delete')

            await handler.delete(request)

            const response = {
                meta: responseHelper.generateMeta(request)
            }
            router.sendResponse(res, response, 200)
        })
    }
}