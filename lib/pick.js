// @ts-check
/**
 *
 * @typedef {Record<string, any>} O
 * @typedef {string} KT
 * @param {O} o
 * @param {KT[] | KT} keys
 * @returns {{[k in keyof O & KT]: O[k]}}
 */
const pick = (o, keys = []) => {
  const ks = Array.isArray(keys) ? keys : [keys]
  return Object.fromEntries(
    ks.filter(k => k in o).map(k => [k, o[k]]))
}

module.exports = pick
