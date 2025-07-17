'use strict'

const async = require('async')
const {Handler} = require('./Handler')

class ChainHandler extends Handler {
  chain (otherHandler) {
    const self = this
    if (otherHandler.handlesSort) {
      this.handlesSort = true
    }
    if (otherHandler.handlesFilter) {
      this.handlesFilter = true
    }
    if (self.otherHandler instanceof ChainHandler) {
      self.otherHandler.chain(otherHandler)
      return self
    }
    self.otherHandler = otherHandler
    self.ready = true
    return self
  }
}

[ 'Initialise', 'Close', 'Search', 'Find', 'Create', 'Delete', 'Update' ].forEach(action => {
  const lowerAction = action.toLowerCase()
  ChainHandler.prototype[lowerAction] = function (...argsIn) {
    const request = argsIn[0]
    const callback = argsIn.pop()
    // This block catches invocations to synchronous functions (.initialise())
    if (!(callback instanceof Function)) {
      argsIn.push(callback)
      if (this[`before${action}`]) this[`before${action}`](...argsIn)
      if (typeof this.otherHandler[lowerAction] === 'function') {
        // sync functions like .initialise() and .close() are optional
        this.otherHandler[lowerAction](...argsIn)
      }
      if (this[`after${action}`]) this[`after${action}`](...argsIn)
      return
    }
    async.waterfall([
      (callback) => {
        if (!this[`before${action}`]) return callback(null, ...argsIn)
        this[`before${action}`](...argsIn, callback)
      },
      (...argsOut) => {
        const callback = argsOut.pop()
        this.otherHandler[lowerAction](...argsOut, callback)
      },
      (...argsOut) => {
        const callback = argsOut.pop()
        if (!this[`after${action}`]) return callback(null, ...argsOut)
        this[`after${action}`](request, ...argsOut, callback)
      }
    ], callback)
  }
})

exports = module.exports = ChainHandler
