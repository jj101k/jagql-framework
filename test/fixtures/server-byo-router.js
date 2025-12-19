'use strict'

import fs from "fs"
import path from "path"

import express from "express"

import { fileURLToPath } from "url"
import { jsonApi } from "../../lib/index.js"

const app = express()

jsonApi.setConfig({
  port: 0,
  router: app
})

const resourcesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'example', 'resources')
const resourcePaths = fs.readdirSync(resourcesPath).filter(filename => /^[a-z].*\.js$/.test(filename))
  .map(filename => path.join(resourcesPath, filename))

await Promise.all(resourcePaths.map(path => import(path)))

jsonApi.start()
const server = app.listen(0)

setTimeout(() => {
  jsonApi.close()
  server.close()
}, 500)
