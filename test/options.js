'use strict'

import assert from "assert"
import jsonApiTestServer from "../example/server.js"
import helpers from "./helpers.js"

describe('Testing jsonapi-server', () => {
  describe('OPTIONS request', () => {
    it('returns 204', async () => {
      const url = 'http://localhost:16999/rest/'
      const {err, res} = await helpers.requestAsyncNoAssert({
        method: 'OPTIONS',
        url
      })
      assert(!err)
      assert.strictEqual(res.statusCode, 204, 'Expecting 200 OK')
      assert.strictEqual(res.headers['content-type'], 'application/vnd.api+json', 'should have a content-type')
      assert.strictEqual(res.headers['access-control-allow-origin'], '*', 'should have CORS headers')
      assert.strictEqual(res.headers['access-control-allow-methods'], 'GET, POST, PATCH, DELETE, OPTIONS', 'should have CORS headers')
      assert.strictEqual(res.headers['access-control-allow-headers'], '', 'should have CORS headers')
      assert.strictEqual(res.headers['cache-control'], 'private, must-revalidate, max-age=0', 'should have non-caching headers')
      assert.strictEqual(res.headers.expires, 'Thu, 01 Jan 1970 00:00:00', 'should have non-caching headers')
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
