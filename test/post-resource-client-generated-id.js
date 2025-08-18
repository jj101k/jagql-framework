'use strict'

const assert = require('assert')

const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Creating a new resource with client-generated ID', () => {
    describe('creates a resource', () => {
      let id = 'e4a1a34f-151b-41ca-a0d9-21726068ba8b'

      it('works', async () => {
        const data = {
          method: 'post',
          url: 'http://localhost:16999/rest/people',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'id': id,
              'type': 'people',
              'attributes': {
                firstname: 'Harry',
                lastname: 'Potter',
                email: 'harry.potter@hogwarts.edu.uk'
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        const responseBody = helpers.validateJson(json)

        assert.strictEqual(responseBody.data.id, id)
        assert.strictEqual(res.headers.location, `http://localhost:16999/rest/people/${responseBody.data.id}`)
        assert.strictEqual(res.statusCode, 201, 'Expecting 201')
        assert.strictEqual(responseBody.data.type, 'people', 'Should be a people resource')
      })

      it('new resource is retrievable', async () => {
        const url = `http://localhost:16999/rest/people/${id}`
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        assert.strictEqual(data.included.length, 0, 'Should be no included resources')
      })

      it('deletes the resource', async () => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16999/rest/people/' + id
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        const responseBody = JSON.parse(json)
        const keys = Object.keys(responseBody)
        assert.deepEqual(keys, [ 'meta' ], 'Should only have a meta block')
        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
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
