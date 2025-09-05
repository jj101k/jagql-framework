'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('unavailable functions', () => {
    it('responds with a clear error', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/photos/14'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      const responseBody = helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      assert.strictEqual(responseBody.errors[0].detail, "The requested resource \"photos\" does not support \"delete\"")
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
