'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe('Testing jsonapi-server', () => {
  describe('Deleting a resource', () => {
    it('errors with invalid type', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/foobar/someId'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with invalid id', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/comments/foobar'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    describe('deleting a comment', () => {
      it('deletes the resource', async () => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16999/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408'
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        const responseData = JSON.parse(json)
        const keys = Object.keys(responseData)
        assert.deepEqual(keys, [ 'meta' ], 'Should only have a meta block')
        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
      })

      it('new resource is gone', async () => {
        const url = 'http://localhost:16999/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 404, 'Expecting 404')
      })
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
