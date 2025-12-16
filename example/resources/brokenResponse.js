'use strict'

import { jsonApi } from "../../lib/jsonApi.js"
import brokenResponseHandler from "../handlers/brokenResponseHandler.js"

jsonApi.define({
  namespace: 'json:api',
  resource: 'brokenResponse',
  description: 'Example demonstrating error handling of broken responses',
  handlers: brokenResponseHandler,
  primaryKey: 'uuid',
  searchParams: { },
  attributes: {
    boolean: jsonApi.Joi.boolean(),
    number: jsonApi.Joi.number()
  },
  options: {
    enforceSchemaOnGet: true,
  },
  examples: [
    // Note resource is not broken - the handler is.
    {
      id: 'b3ea78f4-8d03-4708-9945-d58cadc97b04',
      type: 'brokenResponse',
      boolean: true,
      number: 3
    }
  ]
})
