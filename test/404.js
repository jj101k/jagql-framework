'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('404 pages', () => {
    it('errors with invalid type #1', async () => {
      const data = {
        method: 'get',
        url: 'http://localhost:16999/res'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.equal(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with invalid type #2', async () => {
      const data = {
        method: 'get',
        url: 'http://localhost:16999/rest/a/b/c/d/e'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
