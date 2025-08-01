'use strict'

const testHelpers = module.exports = { }

const assert = require('assert')
const request = require('./request')
const swaggerValidator = require('./swaggerValidator.js')
const fs = require('fs')
const path = require('path')

testHelpers.validateError = json => {
  try {
    json = JSON.parse(json)
  } catch (e) {
    console.log(json)
    throw new Error('Failed to parse response')
  }
  let keys = Object.keys(json)
  assert.deepEqual(keys, [ 'jsonapi', 'meta', 'links', 'errors' ], 'Errors should have specific properties')
  assert.strictEqual(typeof json.links.self, 'string', 'Errors should have a "self" link')
  assert.ok(json.errors instanceof Array, 'errors should be an array')
  json.errors.forEach(error => {
    keys = Object.keys(error)
    assert.deepEqual(keys, [ 'status', 'code', 'title', 'detail' ], 'errors should have specific properties')
    keys.forEach(i => {
      if (i === 'detail') return
      assert.strictEqual(typeof error[i], 'string', `${i} should be a string`)
    })
  })
  return json
}

testHelpers.validateJson = json => {
  try {
    json = JSON.parse(json)
  } catch (e) {
    console.log(json)
    throw new Error('Failed to parse response')
  }
  assert.ok(json instanceof Object, 'Response should be an object')
  assert.ok(json.jsonapi instanceof Object, 'Response should have a jsonapi block')
  assert.ok(json.meta instanceof Object, 'Response should have a meta block')
  assert.ok(json.links instanceof Object, 'Response should have a links block')
  assert.ok(!(json.errors instanceof Object), 'Response should not have any errors: ' + JSON.stringify(json.errors))
  assert.strictEqual(typeof json.links.self, 'string', 'Response should have a "self" link')
  testHelpers.validatePagination(json)
  return json
}

testHelpers.validatePagination = json => {
  if (!json.meta.page) return
  if (!(json.data instanceof Array)) return

  const page = json.meta.page
  let expectedCount = null
  if ((page.offset + page.limit) > page.total) {
    expectedCount = page.total - page.offset
  } else if (page.limit < page.total) {
    expectedCount = page.limit
  } else {
    expectedCount = page.total
  }

  if (expectedCount !== json.data.length) {
    console.warn('!!!!!!!!!!!!')
    console.warn(json.links.self)
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
  someDataBlock.forEach(dataBlock => {
    assert.ok(dataBlock.id, 'Relationship block should have an id')
    assert.strictEqual(typeof dataBlock.id, 'string', 'Relationship data blocks id should be string')
    assert.ok(dataBlock.type, 'Relationship block should have a type')
    assert.strictEqual(typeof dataBlock.type, 'string', 'Relationship data blocks type should be string')
  })
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

testHelpers.request = (params, callback) => {
  return request(params, (err, res, json) => {
    try {
      swaggerValidator.assert(params, res.statusCode, json)
    } catch (e) {
      return callback(err ?? e, res, json)
    }
    return callback(err, res, json)
  })
}

/**
 *
 * @param {*} params
 * @returns {{err: any, res: any, json: any}}
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
 * @returns {{err: any, res: any, json: any}}
 */
testHelpers.requestAsyncNoAssert = (params) => {
  return new Promise((resolve) => request(params, (err, res, json) => {
    resolve({err, res, json})}))
}