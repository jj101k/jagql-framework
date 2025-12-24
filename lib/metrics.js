'use strict'
import { EventEmitter } from "events"

/**
 * @typedef {import("./JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
export class metrics {
    /**
     * Application metrics are generated and exposed via an event emitter interface.
     * Whenever a request has been processed and it about to be returned to the customer,
     * a `data` event will be emitted:
     *
     * ```javascript
     * jsonApi.metrics.on("data", function(data) {
     *   // send data to your metrics stack
     * });
     * ```
     */
    emitter = new EventEmitter()

    /**
     *
     * @param {JsonApiRequest | null} request
     * @returns
     */
    #identifyRequest(request) {
        if(!request) {
            return {route: "invalid", verb: "GET"}
        }
        return {
            route: this.#replaceUUIDsInRoute(request.route.path).replace(/\/$/, ""),
            verb: request.route.verb || "GET"
        }
    }

    /**
     * Replaces literal UUIDs in the URL with :id
     *
     * @param {string} routeString
     * @returns
     */
    #replaceUUIDsInRoute(routeString) {
        return routeString.replace(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/ig, ':id')
    }

    /**
     *
     * @param {JsonApiRequest} request
     * @param {number} httpCode
     * @param {import("./JsonApiResponse.js").JsonApiResponseBodyWithMeta | import("./JsonApiResponse.js").JsonApiResponseBodyErrorWithMeta} payload
     * @param {number} [duration]
     */
    processResponse(request, httpCode, payload, duration) {
        this.emitter.emit('data', {
            ...this.#identifyRequest(request),
            httpCode,
            error: ("errors" in payload && payload.errors) ? payload.errors[0].title : null,
            duration: duration || 0
        })
    }
}

