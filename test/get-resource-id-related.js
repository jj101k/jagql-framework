'use strict'

import assert from "assert"
import jsonApiTestServer from "../example/server.js"
import { jsonApi } from "../lib/jsonApi.js"
import helpers from "./helpers.js"

describe('Testing jsonapi-server', () => {
    describe('Finding a related resource', () => {
        it('unknown id should error', async () => {
            const url = 'http://localhost:16999/rest/articles/foobar/author'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            helpers.validateError(json)
            assert.strictEqual(res.statusCode, 404, 'Expecting 404')
        })

        it('unknown relationship should error', async () => {
            const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/foobar'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            helpers.validateError(json)
            assert.strictEqual(res.statusCode, 404, 'Expecting 404')
        })

        it('foreign relationship should error', async () => {
            const url = 'http://localhost:16999/rest/people/cc5cca2e-0dd8-4b95-8cfc-a11230e73116/articles'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateError(json)
            assert.strictEqual(data.errors[0].code, 'EFOREIGN')
            assert.strictEqual(res.statusCode, 404, 'Expecting 404')
        })

        it('Lookup by id', async () => {
            const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            helpers.validateResource(data.data)
            assert.strictEqual(data.data.type, 'people', 'Should be a people resource')
            assert.strictEqual(data.meta.page, undefined, 'Pagination should be undefined')
        })

        it('Lookup by id for 1:m', async () => {
            const url = 'http://localhost:16999/rest/articles/1be0913c-3c25-4261-98f1-e41174025ed5/photos'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            for (const resource of data.data) {
                helpers.validateResource(resource)
            }
            assert.strictEqual(data.meta.page?.total, 2, 'should include pagination')
            helpers.validatePagination(data)
        })

        it("can find related resources (1:m) paginated", async () => {
            const url = "http://localhost:16999/rest/articles/1be0913c-3c25-4261-98f1-e41174025ed5/photos?page[limit]=1"

            let { err, res, json } = await helpers.requestAsync({
                method: "GET",
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, "Expecting 200 OK")
            for (const resource of data.data) {
                helpers.validateResource(resource)
            }
            assert.strictEqual(data.meta.page?.total, 2, "should include pagination hint")
            assert.strictEqual(data.data.length, 1, "only one record should be returned")
            helpers.validatePagination(data)
        })

        it('with null data', async () => {
            const url = 'http://localhost:16999/rest/comments/2f716574-cef6-4238-8285-520911af86c1/author'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)
            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            assert.strictEqual(data.data, null)
            assert(!('included' in data), "Null resource DON'T have `includes` attribute")
        })

        it('with fields', async () => {
            const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?fields[people]=email'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            helpers.validateResource(data.data)
            const keys = Object.keys(data.data.attributes)
            assert.deepEqual(keys, ['email'], 'Should only contain email attribute')
        })

        it('with filter', async () => {
            const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?filter[email]=email@example.com'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            assert(!data.data)
        })

        it("can fetch related entities with includes", async () => {
            const url = 'http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?include=articles'
            const { err, res, json } = await helpers.requestAsync({
                method: 'GET',
                url
            })
            assert.strictEqual(err, null)
            const data = helpers.validateJson(json)

            assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
            assert.strictEqual(data.included.length, 1, 'Should be 1 included resource')

            const people = data.included.filter(resource => resource.type === 'articles')
            assert.strictEqual(people.length, 1, 'Should be 1 included articles resource')
            assert.strictEqual(data.meta.include.dropped, 0, "No includes were dropped")
        })

        describe("Limited includes", () => {
            const jsonApiStatic = jsonApi.Static
            before(() => jsonApiStatic.config.includeLimit = 0)
            after(() => delete jsonApiStatic.config.includeLimit)

            it("can fetch related entities with limited includes", async () => {
                const url = "http://localhost:16999/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?include=articles"
                const { err, res, json } = await helpers.requestAsync({
                    method: "GET",
                    url
                })
                assert.strictEqual(err, null)
                const data = helpers.validateJson(json)

                assert.strictEqual(res.statusCode, 200, "Expecting 200 OK")
                assert.strictEqual(data.included.length, 0, "Should be 0 included resources")

                assert.strictEqual(data.meta.include.dropped, 1, "All includes were dropped")
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
