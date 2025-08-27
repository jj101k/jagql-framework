'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Finding a specific resource', () => {
    it('unknown id should error', async () => {
      const url = 'http://localhost:16999/rest/articles/foobar'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it("should produce an error for a broken response", async () => {
      const url = "http://localhost:16999/rest/brokenResponse/b3ea78f4-8d03-4708-9945-d58cadc97b04"
      const {err, res, json} = await helpers.requestAsyncNoAssert({
        method: "GET",
        url
      })
      assert.strictEqual(err, null)
      helpers.validateError(json)
      const errors = JSON.parse(json).errors
      assert.strictEqual(res.statusCode, 500, "Expecting 500")
      assert.strictEqual(errors.length, 1)
      assert.strictEqual(errors[0].code, "EINVALIDITEM")
      assert.strictEqual(errors[0].meta.error, `"boolean" must be a boolean`)
      assert.strictEqual(errors[0].detail, `"boolean" must be a boolean`)
    })

    it('valid lookup', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      const data = helpers.validateJson(json)

      assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
      assert.strictEqual(data.included.length, 0, 'Should be no included resources')
      helpers.validateResource(data.data)
    })

    it('with fields', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?fields[articles]=title'
      const {err, res, json} = await helpers.requestAsyncNoAssert({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      const data = helpers.validateJson(json)

      assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
      helpers.validateResource(data.data)
      const keys = Object.keys(data.data.attributes)
      assert.deepEqual(keys, [ 'title' ], 'Should only contain title attribute')
    })

    it('with filter', async () => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?filter[title]=title'
      const {err, res, json} = await helpers.requestAsync({
        method: 'GET',
        url
      })
      assert.strictEqual(err, null)
      helpers.validateError(json)

      assert.strictEqual(res.statusCode, 404, 'Expecting 404 NOT FOUND')
    })

    describe('with includes', () => {
      it('basic include', async () => {
        const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?include=author'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(data.included.length, 1, 'Should be 1 included resource')

        const people = data.included.filter(resource => resource.type === 'people')
        assert.strictEqual(people.length, 1, 'Should be 1 included people resource')
      })

      it('including over a null relation', async () => {
        const url = 'http://localhost:16999/rest/tags/8d196606-134c-4504-a93a-0d372f78d6c5?include=parent'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(data.included.length, 0, 'Should be 0 included resources')
      })
    })

    describe('with recursive includes', () => {
      it('works with a manually expanded string', async () => {
        const url = 'http://localhost:16999/rest/tags/7541a4de-4986-4597-81b9-cf31b6762486?include=parent.parent.parent.parent.articles'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(data.included.length, 5, 'Should be 5 included resources')
        assert.strictEqual(data.included[4].type, 'articles', 'Last include should be an article')
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
