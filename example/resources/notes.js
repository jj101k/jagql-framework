"use strict"

const jsonApi = require("../../lib/jsonApi.js")
const notesHandler = require("../handlers/notesHandler.js")
const uuid = require('uuid')

jsonApi.define({
  namespace: "json:api",
  resource: "notes",
  description: "Like comments, but for bulk test",
  handlers: notesHandler,
  searchParams: { },
  primaryKey: "uuid",
  attributes: {
    body: jsonApi.Joi.string().required()
      .description("The tag name")
      .example("Summer"),
    timestamp: jsonApi.Joi.string().regex(/^[12]\d\d\d-[01]\d-[0123]\d$/)
      .description("The date on which the comment was created, YYYY-MM-DD")
      .example("2017-05-01"),
  },
  examples: [
    ...new Array(100_000)
  ].map((_, i) => ({
    id: uuid.v4(),
    type: "notes",
    body: `First! ${i}`,
    timestamp: "2017-01-02",
  }))
})
