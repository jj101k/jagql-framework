'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe('Testing jsonapi-server (pre)', () => {
  const resources = [ { name: 'articles', count: 4 },
    { name: 'comments', count: 3 },
    { name: 'people', count: 4 },
    { name: 'photos', count: 4 },
    { name: 'tags', count: 5 }
  ]
  for(const resource of resources) {
    describe(`Searching for ${resource.name}`, () => {
      it(`should find ${resource.count}`, async () => {
        const url = `http://localhost:16999/rest/${resource.name}`
        const {err, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)
        assert.strictEqual(data.data.length, resource.count, `Expected ${resource.count} resources`)
      })
    })
  }

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
