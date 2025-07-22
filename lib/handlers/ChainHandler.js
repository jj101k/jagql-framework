'use strict'

const {Handler} = require('./Handler')
const { Promisify } = require('../promisify')

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
  ChainHandler.prototype[lowerAction] = async function (...argsIn) {
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
    let after
    try {
      const argsBefore = this[`before${action}`] ?
        await Promisify.promisifyMulti(this[`before${action}`].bind(this))(...argsIn) : argsIn
      const result = await Promisify.promisifyMulti(this.otherHandler[lowerAction].bind(this.otherHandler))(...argsBefore)

      after = this[`after${action}`] ?
        await Promisify.promisifyMulti(this[`after${action}`]).bind(this)(request, ...result) :
        result
    } catch(err) {
      return callback(err)
    }
    callback(null, ...after)
  }
})

exports = module.exports = ChainHandler
