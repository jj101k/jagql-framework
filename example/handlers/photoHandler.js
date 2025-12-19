'use strict'

import { jsonApi } from "../../lib/index.js"

const handler = new jsonApi.CallbackHandlers.Memory()
handler.delete = null
export default handler