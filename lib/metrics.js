'use strict'
const EventEmitter = require('events').EventEmitter

module.exports = class metrics {
  static emitter = new EventEmitter()

  static #replaceUUIDsInRoute(routeString) {
    return routeString.replace(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/ig, ':id')
  }

  static #replaceTrailingSlashesInRoute(routeString) {
    return routeString.replace(/\/$/, '')
  }

  static processResponse(request, httpCode, payload, duration) {
    let route = request ? request.route.path : 'invalid'
    route = this.#replaceUUIDsInRoute(route)
    route = this.#replaceTrailingSlashesInRoute(route)

    this.emitter.emit('data', {
      route,
      verb: request ? request.route.verb || 'GET' : 'GET',
      httpCode,
      error: payload.errors ? payload.errors[0].title : null,
      duration: duration || 0
    })
  }
}

