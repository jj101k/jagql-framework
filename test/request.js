import fetch from "node-fetch"

/**
 *
 * @param {{method: string, url: string, headers?: Record<string, string>, body?: string}} data
 * @param {(err: * | null, res?: {statusCode: number, headers: Record<string, string>}, json?: string) => *} cb
 */
async function request (data, cb) {
  /**
   * @type {import("node-fetch").Response | undefined}
   */
  let result
  try {
    result = await fetch(data.url, {
      method: data.method,
      headers: data.headers,
      body: data.body
    })
  } catch (e) {
    console.error(e)
    cb(e)
    return
  }
  const json = await result.text()

  cb(null, { statusCode: result.status, headers: Object.fromEntries(result.headers.entries()) }, json)
}

export default request