'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Adding to a relationship', () => {
    it('errors with invalid type', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/foobar/someId/relationships/author'
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with invalid id', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/articles/foobar/relationships/author',
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

    it('errors with invalid type', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/comments',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': '6b017640-827c-4d50-8dcc-79d766abb408' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    describe('adding to a many()', () => {
      it('updates the resource', async () => {
        const data = {
          method: 'post',
          url: 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/comments',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'comments', 'id': '6b017640-827c-4d50-8dcc-79d766abb408', meta: { 'updated': '2016-01-01' } }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 201, 'Expecting 201')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/comments'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, [
          {
            'type': 'comments',
            'id': '3f1a89c2-eb85-4799-a048-6735db24b7eb'
          },
          {
            'type': 'comments',
            'id': '6b017640-827c-4d50-8dcc-79d766abb408',
            'meta': {
              'updated': '2016-01-01'
            }
          }
        ])
      })
    })

    describe('adding to a one()', () => {
      it('updates the resource', async () => {
        const data = {
          method: 'post',
          url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'cc5cca2e-0dd8-4b95-8cfc-a11230e73116' }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 201, 'Expecting 201')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, {
          'type': 'people',
          'id': 'cc5cca2e-0dd8-4b95-8cfc-a11230e73116'
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
