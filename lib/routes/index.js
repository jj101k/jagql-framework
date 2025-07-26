'use strict'
const fs = require('fs')
const path = require('path')

module.exports = class routes {
  static handlers = { }

  static register() {
    fs.readdirSync(__dirname).filter(filename => /\.js$/.test(filename) && (filename !== 'index.js') && (filename !== 'helper.js')).sort().forEach(filename => {
      routes.handlers[filename] = require(path.join(__dirname, filename))
    })
    for (const i in routes.handlers) {
      routes.handlers[i].register()
    }
  }
}