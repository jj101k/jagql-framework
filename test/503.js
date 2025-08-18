'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server')
const jsonApiResources = require('../lib/jsonApiResources.js')

describe('Testing jsonapi-server', () => {
  describe('resource readiness', () => {
    it('returns 200 if resource is ready', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      const {err, res} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert(!err)
      assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
    })

    it('returns 503 if resource is NOT ready', async () => {
      const handlers = jsonApiResources.articles.handlers
      const savedHandlersReady = handlers.ready
      handlers.ready = false
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      const {err, res} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert(!err)
      assert.strictEqual(res.statusCode, 503, 'Expecting 503 SERVICE UNAVAILABLE')
      handlers.ready = savedHandlersReady
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
