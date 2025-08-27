'use strict'

const testHelpers = module.exports = { }

const assert = require('assert')
const request = require('./request')
const swaggerValidator = require('./swaggerValidator.js')

/**
 *
 * @param {*} json
 * @throws
 * @returns
 */
testHelpers.validateError = json => {
  let data
  try {
    data = JSON.parse(json)
  } catch (e) {
    console.log(json, e)
    throw new Error('Failed to parse response')
  }
  let keys = Object.keys(data)
  assert.deepEqual(keys, [ 'jsonapi', 'meta', 'links', 'errors' ], 'Errors should have specific properties')
  assert.strictEqual(typeof data.links.self, 'string', 'Errors should have a "self" link')
  assert.ok(data.errors instanceof Array, 'errors should be an array')
  for(const error of data.errors) {
    keys = Object.keys(error)
    assert.ok(keys.includes("status"), "error has a status")
    assert.ok(keys.includes("code"), "error has a code")
    assert.ok(keys.includes("title"), "error has a title")
    assert.equal(keys.filter(k => ![ "status", "code", "title", "detail", "meta" ].includes(k)).length, 0, "error has no unexpected keys")
    for(const i of ["status", "code", "title", "detail"]) {
      if(error[i] === undefined) {
        continue
      }
      assert.strictEqual(typeof error[i], 'string', `${i} should be a string`)
    }
  }
  return data
}

/**
 *
 * @param {string} json
 * @returns {*}
 */
testHelpers.validateJson = json => {
  let data
  try {
    data = JSON.parse(json)
  } catch (e) {
    console.log(json, e)
    throw new Error('Failed to parse response')
  }
  assert.ok(data instanceof Object, 'Response should be an object')
  assert.ok(data.jsonapi instanceof Object, 'Response should have a jsonapi block')
  assert.ok(data.meta instanceof Object, 'Response should have a meta block')
  assert.ok(data.links instanceof Object, 'Response should have a links block')
  assert.ok(!(data.errors instanceof Object), 'Response should not have any errors: ' + JSON.stringify(data.errors))
  assert.strictEqual(typeof data.links.self, 'string', 'Response should have a "self" link')
  testHelpers.validatePagination(data)
  return data
}

/**
 *
 * @param {*} data
 * @returns
 */
testHelpers.validatePagination = data => {
  if (!data.meta.page) return
  if (!(data.data instanceof Array)) return

  const page = data.meta.page
  let expectedCount = null
  if ((page.offset + page.limit) > page.total) {
    expectedCount = page.total - page.offset
  } else if (page.limit < page.total) {
    expectedCount = page.limit
  } else {
    expectedCount = page.total
  }

  if (expectedCount !== data.data.length) {
    console.warn('!!!!!!!!!!!!')
    console.warn(data.links.self)
    console.warn("WARNING: Pagination count doesn't match resource count.")
    console.warn('This usually indicates the resource hanlder is not filtering correctly!')
    console.warn('!!!!!!!!!!!!')
  }
}

testHelpers.validateRelationship = relationship => {
  assert.ok(relationship.meta instanceof Object, 'Relationships should have a meta block')
  assert.strictEqual(typeof relationship.meta.relation, 'string', 'Relationships should have a relation type')
  assert.ok([ 'primary', 'foreign' ].indexOf(relationship.meta.relation) > -1, 'Relationships must be primary or foreign')
  assert.strictEqual(typeof relationship.meta.readOnly, 'boolean', 'Relationships should have a readOnly flag')

  assert.ok(relationship.links instanceof Object, 'Relationships should have a links block')
  assert.strictEqual(typeof relationship.links.self, 'string', 'Relationships should have a "self" link')
  assert.strictEqual(typeof relationship.links.related, 'string', 'Relationships should have a "related" link')

  assert.ok(relationship.data instanceof Object, 'Relationships should have a data block')

  let someDataBlock = relationship.data
  if (!(someDataBlock instanceof Array)) someDataBlock = [ someDataBlock ]
  for(const dataBlock of someDataBlock) {
    assert.ok(dataBlock.id, 'Relationship block should have an id')
    assert.strictEqual(typeof dataBlock.id, 'string', 'Relationship data blocks id should be string')
    assert.ok(dataBlock.type, 'Relationship block should have a type')
    assert.strictEqual(typeof dataBlock.type, 'string', 'Relationship data blocks type should be string')
  }
}

testHelpers.validateResource = resource => {
  assert.ok(resource.id, 'Resources must have an id')
  assert.ok(resource.type, 'Resources must have a type')
  assert.ok(resource.attributes instanceof Object, 'Resources must have attributes')
  assert.ok(resource.links instanceof Object, 'Resources must have links')
  assert.strictEqual(typeof resource.links.self, 'string', 'Resources must have "self" links')
}

testHelpers.validateArticle = resource => {
  testHelpers.validateResource(resource)
  assert.strictEqual(resource.type, 'articles', 'Resources must have a type of articles')
  assert.strictEqual(typeof resource.attributes.title, 'string', 'An articles title should be a string')
  assert.strictEqual(typeof resource.attributes.content, 'string', 'An articles content should be a string')
  assert.strictEqual(typeof resource.attributes.status, 'string', 'An articles status should default to, and always be, a string')
  assert.strictEqual(resource.relationships.author.meta.relation, 'primary', 'An articles author is a primary relation')
  testHelpers.validateRelationship(resource.relationships.author)
  assert.strictEqual(resource.relationships.tags.meta.relation, 'primary', 'An articles tags are a primary relation')
  testHelpers.validateRelationship(resource.relationships.tags)
  assert.strictEqual(resource.relationships.photos.meta.relation, 'primary', 'An articles photos are a primary relation')
  testHelpers.validateRelationship(resource.relationships.photos)
  assert.strictEqual(resource.relationships.comments.meta.relation, 'primary', 'An articles comments are a primary relation')
  testHelpers.validateRelationship(resource.relationships.comments)
}

testHelpers.validatePhoto = resource => {
  testHelpers.validateResource(resource)
  assert.strictEqual(resource.type, 'photos', 'Resources must have a type of photos')
  assert.strictEqual(typeof resource.attributes.title, 'string', 'An photos title should be a string')
  assert.strictEqual(typeof resource.attributes.url, 'string', 'An photos url should be a string')
  assert.strictEqual(typeof resource.attributes.height, 'number', 'An photos height should be a number')
  assert.strictEqual(typeof resource.attributes.width, 'number', 'An photos width should be a number')
  assert.strictEqual(resource.relationships.photographer.meta.relation, 'primary', 'An photos photographer is a primary relation')
  assert.strictEqual(resource.relationships.articles.meta.relation, 'foreign', 'An photos articles are a foreign relation')
}

/**
 *
 * @param {*} params
 * @returns {{err: any, res: Express.Response, json?: string}}
 */
testHelpers.requestAsync = (params) => {
  return new Promise((resolve, reject) => {
    request(params, (err, res, json) => {
      try {
        swaggerValidator.assert(params, res.statusCode, json)
      } catch (e) {
        reject(e)
        return
      }
      resolve({err, res, json})
    })
  })
}

/**
 *
 * @param {*} params
 * @returns {{err: any, res: Express.Response, json?: string}}
 */
testHelpers.requestAsyncNoAssert = (params) => {
  return new Promise((resolve) => request(params, (err, res, json) => {
    resolve({err, res, json})}))
}