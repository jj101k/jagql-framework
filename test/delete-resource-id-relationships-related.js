'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe('Testing jsonapi-server', () => {
  describe('Removing from a relationship', () => {
    it('errors with invalid type', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/foobar/someId/relationships/author'
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with invalid id', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/articles/foobar/relationships/photos',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': 'fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors with unknown key', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'tags', 'id': 'foobar' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    it('errors with invalid type', async () => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': '7541a4de-4986-4597-81b9-cf31b6762486' }
        })
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    describe('deleting', () => {
      it('deletes the resource on many() (tags)', async () => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'tags', 'id': '7541a4de-4986-4597-81b9-cf31b6762486' }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, [
          {
            'type': 'tags',
            'id': '6ec62f6d-9f82-40c5-b4f4-279ed1765492'
          }
        ])
      })
    })

    describe('deleting', () => {
      it('deletes the resource on one()', async () => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
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
        assert.deepEqual(data.data, null)
      })

      it('restore relationship', async () => {
        const data = {
          method: 'post',
          url: 'http://localhost:16999/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 201, 'Expecting 201')
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
