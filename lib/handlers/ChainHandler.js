'use strict'

const {Handler} = require('./Handler')
const { Promisify } = require('../promisify')

class ChainHandler extends Handler {
  /**
   *
   * @param {Handler} otherHandler
   * @returns
   */
  chain (otherHandler) {
    if (otherHandler.handlesSort) {
      this.handlesSort = true
    }
    if (otherHandler.handlesFilter) {
      this.handlesFilter = true
    }
    if (this.otherHandler instanceof ChainHandler) {
      this.otherHandler.chain(otherHandler)
      return this
    }
    this.otherHandler = otherHandler
    this.ready = true
    return this
  }
}

for(const action of [ 'Initialise', 'Close', 'Search', 'Find', 'Create', 'Delete', 'Update' ]) {
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
        await Promisify.promisifyMulti(this, `before${action}`)(...argsIn) : argsIn
      const result = await Promisify.promisifyMulti(this.otherHandler, lowerAction)(...argsBefore)

      after = this[`after${action}`] ?
        await Promisify.promisifyMulti(this, `after${action}`)(request, ...result) :
        result
    } catch(err) {
      return callback(err)
    }
    callback(null, ...after)
  }
}

exports = module.exports = ChainHandler
