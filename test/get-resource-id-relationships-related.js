'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('forward lookup', () => {
    it('unknown id should error', async () => {
      const url = 'http://localhost:16999/rest/articles/foobar/relationships/author'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('unknown relation should error', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/foobar'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('Lookup by id', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/author'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      const data = helpers.validateJson(json)

      assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
      assert.strictEqual(data.data.type, 'people', 'Should be a people resource')

      assert.ok(data instanceof Object, 'Response should be an object')
      assert.ok(data.meta instanceof Object, 'Response should have a meta block')
      assert.ok(data.links instanceof Object, 'Response should have a links block')
      assert.strictEqual(typeof data.links.self, 'string', 'Response should have a "self" link')

      let someDataBlock = data.data
      if (!(someDataBlock instanceof Array)) someDataBlock = [ someDataBlock ]
      for(const dataBlock of someDataBlock) {
        const keys = Object.keys(dataBlock)
        assert.deepEqual(keys, [ 'type', 'id', 'meta' ], 'Relationship data blocks should have specific properties')
        assert.strictEqual(typeof dataBlock.id, 'string', 'Relationship data blocks id should be string')
        assert.strictEqual(typeof dataBlock.type, 'string', 'Relationship data blocks type should be string')
      }
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
