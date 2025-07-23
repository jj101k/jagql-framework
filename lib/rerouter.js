'use strict'
const router = require('./router.js')
const debug = require('./debugging.js')
const url = require('qs')
const _ = {
  assign: require('lodash.assign'),
  omit: require('lodash.omit')
}

module.exports = class rerouter {
  /**
   *
   * @param {*} newRequest
   */
  static route(newRequest) {
    const validRoutes = router._routes[newRequest.method.toLowerCase()]

    const path = this.#generateSanePath(newRequest)
    const route = this.#pickFirstMatchingRoute(validRoutes, path)

    const urlParams = url.parse(newRequest.uri.split('?')[1] || { })

    const req = {
      url: newRequest.uri,
      originalUrl: newRequest.originalRequest.originalUrl,
      headers: newRequest.originalRequest.headers,
      cookies: newRequest.originalRequest.cookies,
      params: {
        ...this.#mergeParams(urlParams, newRequest.params),
        page: newRequest.params?.page ?? urlParams.page,
      },
    }
    this.#extendUrlParamsOntoReq(route, path, req)

    debug.reroute('Request', route, JSON.stringify(req))

    return new Promise((resolve, reject) => {
      const res = {
        set () { },
        status (httpCode) {
          res.httpCode = httpCode
          return res
        },
        end (payload) {
          const err = null
          if (res.httpCode >= 400) {
            debug.reroute('Error', payload.toString())
            return reject(JSON.parse(payload.toString()))
          }
          if (newRequest.method !== 'GET') {
            debug.reroute('Response', payload.toString())
          }
          const json = JSON.parse(payload.toString())
          if(err) {
            reject(err)
          }
          resolve(json)
        }
      }
      validRoutes[route](req, res, _.omit(newRequest.originalRequest, [ 'params', 'route' ]))
    })
  }


  /**
   *
   * @param {{uri: string}} newRequest
   * @returns
   */
  static #generateSanePath(newRequest) {
    const path = newRequest.uri.replace(/^https?:\/\/[^/]+/, "")

    return router.stripBasePath(path).replace(/^\//, '').split('?')[0].replace(/\/$/, '')
  }

  static #pickFirstMatchingRoute(validRoutes, path) {
    return Object.keys(validRoutes).filter(someRoute => {
      someRoute = someRoute.replace(/(:[a-z]+)/g, '[^/]*?')
      someRoute = new RegExp(`^${someRoute}$`)
      return someRoute.test(path)
    }).pop()
  }

  static #extendUrlParamsOntoReq(route, path, req) {
    route.split('/').forEach((urlPart, i) => {
      if (urlPart[0] !== ':') return
      req.params[urlPart.substring(1)] = path.split('/')[i]
    })
  }

  static #mergeParams(objA, objB) {
    if (!objB) return objA
    return {
      ...objA,
      ...objB,
      ...Object.fromEntries(
        Object.entries(objA).filter(([k]) => k in objB).map(([k, valueA]) => {
          const valueB = objB[k]
          if (!valueB) {
            return [k, valueA]
          } else {
            if ((typeof valueA === 'string') || (typeof valueB === 'string')) {
              return [k, [ valueA, valueB ]]
            } else {
              return [k, this.#mergeParams(valueA, valueB)]
            }
          }
        })
      )
    }
  }
}
