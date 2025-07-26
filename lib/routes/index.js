'use strict'
const fs = require('fs')
const path = require('path')

module.exports = class routes {
  static handlers = { }

  static register() {
    const candidates = fs.readdirSync(__dirname).filter(
      filename => filename.match(/[.]js$/) && filename != "index.js" && filename != "helper.js"
    )
    candidates.sort((a, b) => a.localeCompare(b))
    for(const filename of candidates) {
      this.handlers[filename] = require(path.join(__dirname, filename))
    }
    for (const handler of Object.values(this.handlers)) {
      handler.register()
    }
  }
}