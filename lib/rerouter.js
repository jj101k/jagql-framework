'use strict'
const router = require('./router.js')
const debug = require('./debugging.js')
const url = require('qs')

module.exports = class rerouter {
  /**
   *
   * @param {{method: "GET", uri: string, originalRequest:
   * import('../types/JsonApiRequest.js').JsonApiRequest, params: import('../types/JsonApiRequest.js').JsonApiInternalParams}} newRequest
   */
  static route(newRequest) {
    const validRoutes = router.routes[newRequest.method.toLowerCase()]

    const path = this.#generateSanePath(newRequest)
    const route = this.#pickFirstMatchingRoute(validRoutes, path)

    const urlParams = url.parse(newRequest.uri.split('?')[1] || { })

    const oldRequest = newRequest.originalRequest

    /**
     * @type {Pick<import("express").Request, "app" | "cookies" | "headers" | "params" | "url">}
     */
    const req = {
      app: oldRequest.express.req.app,
      cookies: oldRequest.cookies,
      headers: oldRequest.headers,
      originalUrl: oldRequest.originalUrl,
      params: {
        ...this.#mergeParams(urlParams, newRequest.params),
        page: newRequest.params?.page ?? urlParams.page,
      },
      url: newRequest.uri,
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
          const body = JSON.parse(payload.toString())
          if(err) {
            reject(err)
          }
          resolve(body)
        }
      }
      const strippedRequest = {...newRequest.originalRequest}
      delete strippedRequest.params
      delete strippedRequest.route
      req.app.locals.jsonApiStrippedRequest = strippedRequest
      validRoutes[route](req, res, (err) => {
        if(err) {
          reject(err)
        }
      })
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

  /**
   *
   * @param {string} route
   * @param {string} path
   * @param {*} req
   * @returns
   */
  static #extendUrlParamsOntoReq(route, path, req) {
    for(const [i, urlPart] of route.split('/').entries()) {
      if (!urlPart.startsWith(":")) continue
      req.params[urlPart.substring(1)] = path.split('/')[i]
    }
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
