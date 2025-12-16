'use strict'
import { EventEmitter } from "events"

/**
 * @typedef {import("../types/JsonApiRequest.js").JsonApiRequest} JsonApiRequest
 */

/**
 *
 */
export class metrics {
  static emitter = new EventEmitter()

  /**
   *
   * @param {JsonApiRequest | null} request
   * @returns
   */
  static #identifyRequest(request) {
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
  static #replaceUUIDsInRoute(routeString) {
    return routeString.replace(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/ig, ':id')
  }

  /**
   *
   * @param {JsonApiRequest} request
   * @param {number} httpCode
   * @param {import("../types/JsonApiResponse.js").JsonApiResponseBodyWithMeta | import("../types/JsonApiResponse.js").JsonApiResponseBodyErrorWithMeta} payload
   * @param {number} [duration]
   */
  static processResponse(request, httpCode, payload, duration) {
    this.emitter.emit('data', {
      ...this.#identifyRequest(request),
      httpCode,
      error: ("errors" in payload && payload.errors) ? payload.errors[0].title : null,
      duration: duration || 0
    })
  }
}

