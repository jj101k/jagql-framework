'use strict'

const helper = require('./helper.js')
const router = require('../router.js')
const responseHelper = require('../responseHelper.js')
const PromisifyHandler = require('../promisifyHandler.js')

module.exports = class deleteRoute {
    static register() {
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