'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe('Testing jsonapi-server', () => {
  describe('Creating a new resource', () => {
    it('errors with invalid type', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/foobar'
      }
      const {err, res, json} = await helpers.requestAsync(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 404, 'Expecting 404')
    })

    it('errors if resource doesnt validate', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/articles',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': {
            'type': 'photos',
            'attributes': { },
            'relationships': { }
          }
        })
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      const responseBody = helpers.validateError(json)
      assert.strictEqual(responseBody.errors[0].meta.details.length, 2, 'Expecting several validation errors')
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    it('errors if content-type specifies a media type parameter', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/photos',
        headers: {
          'Content-Type': 'application/vnd.api+json;foobar'
        },
        body: JSON.stringify({
          'data': { }
        })
      }
      const {err, res} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      assert.strictEqual(res.statusCode, 415, 'Expecting 415')
    })

    it('errors if accept header doesnt match JSON:APIs type', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/photos',
        headers: {
          'Accept': 'application/vnd.api+xml, application/vnd.api+json;foobar, text/json'
        },
        body: JSON.stringify({
          'data': { }
        })
      }
      const {err, res} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      assert.strictEqual(res.statusCode, 406, 'Expecting 406')
    })

    it('errors if no body is detected', async () => {
      const data = {
        method: 'post',
        url: 'http://localhost:16999/rest/photos'
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
    })

    it('errors if body.data is not an object', async () => {
      const data = {
        method: 'post',
        // IMPORTANT: we're using people here because it has no required attributes.
        // note that if data comes in as a string, then the value of the string
        // is discarded and an empty people object would be created, which is
        // likely not what the developer of the api client would have intended.
        url: 'http://localhost:16999/rest/people',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        // some api/curl clients fail to fully serialize hashes/dictionaries
        // if their encoding and Content-Type is not properly set.  In that
        // case, you end up with something like this (yes, I'm
        // looking at you, python!)
        body: JSON.stringify({
          'data': 'attributes'
        })
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      const responseBody = helpers.validateError(json)
      assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      // we're checking the deep equal of errors here in case
      // someone makes a field on people required, or changes
      // the resource used on this test to a resource that
      // has a required field.  With this check, this will
      // continue to work properly even if that happens; however,
      // ideally, this test should be run against a resource
      // with NO required fields.
      assert.deepEqual(responseBody.errors, [
        {
          'code': 'EFORBIDDEN',
          'detail': '"data" must be an object - have you sent the right http headers?',
          'status': '403',
          'title': 'Request validation failed'
        }
      ])
    })

    describe('creates a resource', () => {
      let id

      it('works', async () => {
        const data = {
          method: 'post',
          url: 'http://localhost:16999/rest/photos',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'type': 'photos',
              'attributes': {
                'title': 'Ember Hamster',
                'url': 'http://example.com/images/productivity.png',
                'height': 512,
                'width': 1024
              },
              'relationships': {
                'photographer': {
                  'data': { 'type': 'people', 'id': 'cc5cca2e-0dd8-4b95-8cfc-a11230e73116' }
                }
              },
              'meta': {
                'created': '2015-01-01'
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        const responseBody = helpers.validateJson(json)

        assert.strictEqual(res.headers.location, `http://localhost:16999/rest/photos/${responseBody.data.id}`)
        assert.strictEqual(res.statusCode, 201, 'Expecting 201')
        assert.strictEqual(responseBody.data.type, 'photos', 'Should be a people resource')
        helpers.validatePhoto(responseBody.data)
        id = responseBody.data.id
      })

      it('new resource is retrievable', async () => {
        const url = `http://localhost:16999/rest/photos/${id}`
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(data.included.length, 0, 'Should be no included resources')
        helpers.validatePhoto(data.data)
        assert.deepEqual(data.data.meta, { created: '2015-01-01' })
      })
      describe('creates a resource with non-UUID ID', () => {
        let id

        it('works', async () => {
          const data = {
            method: 'post',
            url: 'http://localhost:16999/rest/autoincrement',
            headers: {
              'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
              'data': {
                'type': 'autoincrement',
                'attributes': {
                  'name': 'bar'
                }
              }
            })
          }
          const {err, res, json} = await helpers.requestAsync(data)
          assert.strictEqual(err, null)
          const responseBody = helpers.validateJson(json)

          assert.strictEqual(responseBody.data.id, '2')
          assert.strictEqual(res.headers.location, `http://localhost:16999/rest/autoincrement/${responseBody.data.id}`)
          assert.strictEqual(res.statusCode, 201, 'Expecting 201')
          assert.strictEqual(responseBody.data.type, 'autoincrement', 'Should be a autoincrement resource')
          id = responseBody.data.id
        })

        it('new resource is retrievable', async () => {
          const url = `http://localhost:16999/rest/autoincrement/${id}`
          const {err, res, json} = await helpers.requestAsync({
            method: 'GET',
            url
          })
          assert.strictEqual(err, null)
          const data = helpers.validateJson(json)
          assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
          assert.strictEqual(data.included.length, 0, 'Should be no included resources')
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
