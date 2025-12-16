'use strict'

import assert from "assert"
import helpers from "./helpers.js"
import jsonApiTestServer from "../example/server.js"

describe('Testing jsonapi-server', () => {
  describe('Updating a resource', () => {
    context('with invalid urls', () => {
      it('errors with invalid type', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/foobar/someId'
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 404, 'Expecting 404')
      })

      it('errors with invalid id', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/comments/foobar',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'test': 123
            }
          })
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 404, 'Expecting 404')
      })
    })

    context('with invalid payloads', () => {
      it('errors with invalid attributes', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': 'foobar-date'
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      })

      it('errors with invalid one relationships', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'author': {
                  'data': { 'foo': 'bar' }
                }
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      })

      it('errors with invalid many relationships 1', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'tags': {
                  'data': [ undefined ]
                }
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      })

      it('errors with invalid many relationships 2', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'tags': {
                  'data': [ { 'type': 'tags', 'id': '2a3bdea4-a889-480d-b886-104498c86f69' }, undefined ]
                }
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsync(data)
        assert.strictEqual(err, null)
        helpers.validateError(json)
        assert.strictEqual(res.statusCode, 403, 'Expecting 403')
      })
    })

    it('only validates named attributes', async () => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16999/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': {
            'attributes': {
              'title': 'How to use AWS'
              // content, a required attribute, is missing.
            }
          }
        })
      }
      const {err, res, json} = await helpers.requestAsyncNoAssert(data)
      assert.strictEqual(err, null)
      helpers.validateJson(json)

      assert.strictEqual(res.statusCode, 200, 'Expecting 200')
    })

    describe('updating a comment', () => {
      it('updates the resource', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': '2017-06-29'
              },
              'relationships': {
                'author': {
                  'data': { 'type': 'people', 'id': 'd850ea75-4427-4f81-8595-039990aeede5' }
                }
              },
              'meta': {
                'created': '2013-01-01'
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, {
          'type': 'comments',
          'id': '3f1a89c2-eb85-4799-a048-6735db24b7eb',
          'attributes': {
            'body': 'I like XML better',
            'timestamp': '2017-06-29'
          },
          'links': {
            'self': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
          },
          'relationships': {
            'author': {
              'meta': {
                'relation': 'primary',
                'readOnly': false
              },
              'links': {
                'self': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
                'related': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/author'
              },
              'data': {
                'type': 'people',
                'id': 'd850ea75-4427-4f81-8595-039990aeede5'
              }
            },
            'article': {
              'meta': {
                'relation': 'foreign',
                'belongsTo': 'articles',
                'as': 'comments',
                'readOnly': true,
                'many': false
              },
              'links': {
                'self': 'http://localhost:16999/rest/articles/relationships/?comments=3f1a89c2-eb85-4799-a048-6735db24b7eb',
                'related': 'http://localhost:16999/rest/articles/?filter[comments]=3f1a89c2-eb85-4799-a048-6735db24b7eb'
              }
            }
          },
          'meta': {
            'created': '2013-01-01'
          }
        })
      })

      it('deletes a relationship', async () => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': '2017-06-29'
              },
              'relationships': {
                'author': {
                  'data': null
                }
              },
              'meta': {
                'created': '2013-01-01'
              }
            }
          })
        }
        const {err, res, json} = await helpers.requestAsyncNoAssert(data)
        assert.strictEqual(err, null)
        helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')
      })

      it('new resource has changed', async () => {
        const url = 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
        const {err, res, json} = await helpers.requestAsync({
          method: 'GET',
          url
        })
        assert.strictEqual(err, null)
        const data = helpers.validateJson(json)

        assert.strictEqual(res.statusCode, 200, 'Expecting 200')

        assert.deepEqual(data.data, {
          'type': 'comments',
          'id': '3f1a89c2-eb85-4799-a048-6735db24b7eb',
          'attributes': {
            'body': 'I like XML better',
            'timestamp': '2017-06-29'
          },
          'links': {
            'self': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
          },
          'relationships': {
            'author': {
              'meta': {
                'relation': 'primary',
                'readOnly': false
              },
              'links': {
                'self': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
                'related': 'http://localhost:16999/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/author'
              },
              'data': null
            },
            'article': {
              'meta': {
                'relation': 'foreign',
                'belongsTo': 'articles',
                'as': 'comments',
                'readOnly': true,
                'many': false
              },
              'links': {
                'self': 'http://localhost:16999/rest/articles/relationships/?comments=3f1a89c2-eb85-4799-a048-6735db24b7eb',
                'related': 'http://localhost:16999/rest/articles/?filter[comments]=3f1a89c2-eb85-4799-a048-6735db24b7eb'
              }
            }
          },
          'meta': {
            'created': '2013-01-01'
          }
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
