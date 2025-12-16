'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe("Load test", () => {
  it("can load 100k objects in acceptable time", async () => {
    const { expect } = await import("chai")
    const start = new Date()
    const {err, res, json} = await helpers.requestAsync({
      method: "GET",
      url: "http://localhost:16999/rest/notes?page[limit]=1000000"
    })
    const finish = new Date()
    const elapsedMs = finish.valueOf() - start.valueOf()
    assert.strictEqual(err, null)
    // Note that 100,000 * 5us = 500,000us = 500ms
    expect(elapsedMs).to.be.lessThan(500, "Elapsed time is <5us per item")
    const vjson = helpers.validateJson(json)

    assert.strictEqual(res.statusCode, 200, "Expecting 200 OK")
    assert.deepEqual(vjson.included, [ ], "Response should have no included resources")
    assert.strictEqual(vjson.data.length, 100_000, "Response should contain all resources")
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
