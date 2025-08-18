'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Updating a relation', () => {
    it('errors with invalid type', async () => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16999/rest/foobar/someId/relationships/author'
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with invalid id', async () => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16999/rest/comments/foobar/relationships/author',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with a foreign relation', async () => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/article',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'articles', 'id': 'de305d54-75b4-431b-adb2-eb6b9e546014' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    describe('adding', () => {
      it('updates the resource', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587', meta: { updated: '2012-01-01' } }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, {
          'type': 'people',
          'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587',
          'meta': {
            'updated': '2012-01-01'
          }
        })
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
