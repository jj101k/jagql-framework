'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const request = require('./request')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Finding a specific resource', () => {
    it('unknown id should error', done => {
      const url = 'http://localhost:16999/rest/articles/foobar'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 404, 'Expecting 404')
        done()
      }).catch(done)
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
      assert.strictEqual(errors[0].detail.error, `"boolean" must be a boolean`)
    })

    it('valid lookup', done => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.strictEqual(err, null)
        json = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(json.included.length, 0, 'Should be no included resources')
        helpers.validateResource(json.data)

        done()
      }).catch(done)
    })

    it('with fields', done => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?fields[articles]=title'
      request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.strictEqual(err, null)
        json = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        helpers.validateResource(json.data)
        const keys = Object.keys(json.data.attributes)
        assert.deepEqual(keys, [ 'title' ], 'Should only contain title attribute')

        done()
      }).catch(done)
    })

    it('with filter', done => {
      const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?filter[title]=title'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.strictEqual(err, null)
        json = helpers.validateError(json)

        assert.strictEqual(res.statusCode, 404, 'Expecting 404 NOT FOUND')
        // assert.deepEqual(json.data, null)

        done()
      }).catch(done)
    })

    describe('with includes', () => {
      it('basic include', done => {
        const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?include=author'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.strictEqual(err, null)
          json = helpers.validateJson(json)

          assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
          assert.strictEqual(json.included.length, 1, 'Should be 1 included resource')

          const people = json.included.filter(resource => resource.type === 'people')
          assert.strictEqual(people.length, 1, 'Should be 1 included people resource')

          done()
        }).catch(done)
      })

      it('including over a null relation', done => {
        const url = 'http://localhost:16999/rest/tags/8d196606-134c-4504-a93a-0d372f78d6c5?include=parent'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.strictEqual(err, null)
          json = helpers.validateJson(json)

          assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
          assert.strictEqual(json.included.length, 0, 'Should be 0 included resources')
          done()
        }).catch(done)
      })
    })

    describe('with recursive includes', () => {
      it('works with a manually expanded string', done => {
        const url = 'http://localhost:16999/rest/tags/7541a4de-4986-4597-81b9-cf31b6762486?include=parent.parent.parent.parent.articles'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.strictEqual(err, null)
          json = helpers.validateJson(json)

          assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
          assert.strictEqual(json.included.length, 5, 'Should be 5 included resources')
          assert.strictEqual(json.included[4].type, 'articles', 'Last include should be an article')
          done()
        }).catch(done)
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
