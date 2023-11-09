'use strict'
const responseHelper = module.exports = { }

const _ = {
  assign: require('lodash.assign'),
  pick: require('lodash.pick')
}
const pagination = require('./pagination.js')
const Joi = require('joi')
const debug = require('./debugging.js')

responseHelper.setBaseUrl = baseUrl => {
  responseHelper._baseUrl = baseUrl
}
responseHelper.setMetadata = meta => {
  responseHelper._metadata = meta
}

/**
 *
 * @param {*} v
 * @returns
 */
function isPromise (v) {
  return (typeof v === 'object') && (typeof v?.then === 'function')
}

/**
 * @param item
 */
function convertId(item) {
  if(item.id) {
    item.id = '' + item.id
  }
}

/**
 *
 * @param {*} items
 * @param {*} schema
 * @param {*} callback
 */
responseHelper._checkSchemaOnArray = async (items, schema, callback) => {
  let checkItems
  if (Array.isArray(items)) {
    checkItems = items.slice(0, 10) // Only check the first 10 items, for basic sanity checks
  } else {
    checkItems = [ items ]
  }

  const result = []
  try {
    for (const item of checkItems) {
      convertId(item)
      await new Promise(resolve => {
        debug.validationOutput(JSON.stringify(item))
        Joi.validate(item, schema, (err) => {
          if (err) {
            debug.validationError(err.message, JSON.stringify(item))
          }
          resolve()
        })
      })
    }

    // Whatever happens, we return the success response with all items
    for (const item of items) {
      result.push(await responseHelper._generateDataItem(item, schema))
    }
  } catch (e) {
    callback(e)
    return
  }
  callback(null, result)
}

responseHelper._checkSchemaOnObject = (item, schema, callback) => {
  debug.validationOutput(JSON.stringify(item))
  convertId(item)
  Joi.validate(item, schema, async (err, sanitisedItem) => {
    if (err) {
      debug.validationError(err.message, JSON.stringify(item))
    }

    const dataItem = await responseHelper._generateDataItem(sanitisedItem, schema)
    return callback(null, dataItem)
  })
}

responseHelper._enforceSchemaOnObject = (item, schema, callback) => {
  debug.validationOutput(JSON.stringify(item))
  convertId(item)
  Joi.validate(item, schema, async (err, sanitisedItem) => {
    if (err) {
      debug.validationError(err.message, JSON.stringify(item))
      const res = {
        status: '500',
        code: 'EINVALIDITEM',
        title: 'Item in response does not validate',
        detail: {
          item: item,
          error: err.message
        }
      }
      return callback(res)
    }

    const dataItem = await responseHelper._generateDataItem(sanitisedItem, schema)
    return callback(null, dataItem)
  })
}

/**
 *
 * @param {*} item
 * @param {*} schema
 * @returns
 */
responseHelper._generateDataItem = async (item, schema) => {
  const isSpecialProperty = value => {
    if (!(value instanceof Object)) return false
    if (value._settings) return true
    return false
  }
  const linkProperties = Object.keys(schema).filter(someProperty => isSpecialProperty(schema[someProperty]))
  const attributeProperties = Object.keys(schema).filter(someProperty => {
    if (someProperty === 'id') return false
    if (someProperty === 'type') return false
    if (someProperty === 'meta') return false
    return !isSpecialProperty(schema[someProperty])
  })

  const result = {
    type: item.type,
    id: '' + item.id,
    attributes: _.pick(item, attributeProperties),
    links: responseHelper._generateLinks(item, schema, linkProperties),
    relationships: await responseHelper._generateRelationships(item, schema, linkProperties),
    meta: item.meta
  }

  return result
}

responseHelper._generateLinks = item => ({
  self: `${responseHelper._baseUrl + item.type}/${item.id}`
})

/**
 *
 * @param {*} item
 * @param {*} schema
 * @param {*} linkProperties
 * @returns
 */
responseHelper._generateRelationships = async (item, schema, linkProperties) => {
  if (linkProperties.length === 0) return undefined

  const links = { }

  for (const linkProperty of linkProperties) {
    links[linkProperty] = await responseHelper._generateLink(item, schema[linkProperty], linkProperty)
  }

  return links
}

/**
 *
 * @param {*} item
 * @param {*} schemaProperty
 * @param {*} linkProperty
 * @returns
 */
responseHelper._generateLink = async (item, schemaProperty, linkProperty) => {
  const link = {
    meta: {
      relation: 'primary',
      // type: schemaProperty._settings.__many || schemaProperty._settings.__one,
      readOnly: false
    },
    links: {
      self: `${responseHelper._baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
      related: `${responseHelper._baseUrl + item.type}/${item.id}/${linkProperty}`
    },
    data: undefined
  }

  if (schemaProperty._settings.__many && item[linkProperty] !== undefined) {
    // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
    link.data = [ ]
    let linkItems = isPromise(item[linkProperty]) ? await item[linkProperty] : item[linkProperty]
    if (linkItems) {
      if (!Array.isArray(linkItems)) {
        linkItems = [ linkItems ]
      }
      link.data.push(...linkItems.map(linkItem => ({
        type: linkItem.type,
        id: '' + linkItem.id,
        meta: linkItem.meta
      })))
    }
  }

  if (schemaProperty._settings.__one) {
    link.data = null
    const linkItem = isPromise(item[linkProperty]) ? await item[linkProperty] : item[linkProperty]
    if (linkItem) {
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      link.data = {
        type: linkItem.type,
        id: '' + linkItem.id,
        meta: linkItem.meta
      }
    }
  }

  if (schemaProperty._settings.__as) {
    const relatedResource = (schemaProperty._settings.__one || schemaProperty._settings.__many)[0]
    // get information about the linkage - list of ids and types
    // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.self = `${responseHelper._baseUrl + relatedResource}/relationships/?${schemaProperty._settings.__as}=${item.id}`
    // get full details of all linked resources
    // /rest/bookings/?filter[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.related = `${responseHelper._baseUrl + relatedResource}/?filter[${schemaProperty._settings.__as}]=${item.id}`
    if (item[linkProperty]) {
      link.data = null
    } else {
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      link.data = undefined
    }
    link.meta = {
      relation: 'foreign',
      belongsTo: relatedResource,
      as: schemaProperty._settings.__as,
      many: !!schemaProperty._settings.__many,
      readOnly: true
    }
  }

  return link
}

responseHelper.generateError = (request, err) => {
  debug.errors(request.route.verb, request.route.combined, JSON.stringify(err))
  if (!(Array.isArray(err))) err = [ err ]

  const errorResponse = {
    jsonapi: {
      version: '1.0'
    },
    meta: responseHelper._generateMeta(request),
    links: {
      self: responseHelper._baseUrl + request.route.path
    },
    errors: err.map(error => ({
      status: error.status,
      code: error.code,
      title: error.title,
      detail: error.detail
    }))
  }

  return errorResponse
}

responseHelper._generateResponse = (request, resourceConfig, sanitisedData, handlerTotal) => ({
  jsonapi: {
    version: '1.0'
  },

  meta: responseHelper._generateMeta(request, handlerTotal),

  links: _.assign({
    self: responseHelper._baseUrl + request.route.path + (request.route.query ? ('?' + request.route.query) : '')
  }, pagination.generatePageLinks(request, handlerTotal)),

  data: sanitisedData
})

responseHelper._generateMeta = (request, handlerTotal) => {
  let meta
  if (typeof responseHelper._metadata === 'function') {
    meta = responseHelper._metadata(request)
  } else {
    meta = _.assign({ }, responseHelper._metadata)
  }

  if (handlerTotal) {
    meta.page = pagination.generateMetaSummary(request, handlerTotal)
  }

  return meta
}
