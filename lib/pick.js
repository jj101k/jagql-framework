// @ts-check
/**
 *
 * @typedef {Record<string, any>} O
 * @typedef {string} KT
 * @param {O} o
 * @param {KT[]} keys
 * @returns {{[k in keyof O & KT]: O[k]}}
 */
const pick = (o, ...keys) => {
  /**
   * @type {KT[]}
   */
  const ks = [...keys]
  const ox = Object.fromEntries(
    ks.filter(k => k in o).map(k => [k, o[k]]))
  return ox
}

module.exports = pick
