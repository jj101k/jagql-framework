'use strict'

const assert = require('assert')
const jsonApiTestServer = require('../example/server.js')
const helpers = require('./helpers.js')

describe('Testing jsonapi-server', () => {
  describe('authentication', () => {
    it('blocks access with the blockMe header', async () => {
      const data = {
        method: 'get',
        url: 'http://localhost:16999/rest/articles',
        headers: {
          'blockMe': 'please'
        }
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      assert.strictEqual(res.statusCode, 401, 'Expecting 401')
      helpers.validateError(json)
    })

    it('blocks access with the blockMe cookies', async () => {
      const data = {
        method: 'get',
        url: 'http://localhost:16999/rest/articles',
        headers: {
          'cookie': 'blockMe=please'
        }
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      assert.strictEqual(res.statusCode, 401, 'Expecting 401')
      helpers.validateError(json)
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
