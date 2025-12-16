/**
 *
 */
export class tools {
    /**
     * Ensures that you have an array of values even if v is a non-array.
     *
     * @template T
     * @param {T | T[]} v
     * @returns {T[]}
     */
    static ensureArray(v) {
        if(Array.isArray(v)) {
            return v
        } else {
            return [v]
        }
    }
    /**
     * Ensures that you have an array of values even if v is a non-array,
     * ensuring that null maps to [].
     *
     * @param {*} v
     * @returns
     */
    static ensureArrayNotNullish(v) {
        return this.ensureArray(v ?? [])
    }

    /**
     *
     * @param {*} v
     * @returns {v is Promise<any>}
     */
    static isPromise (v) {
        return (typeof v === 'object') && (typeof v?.then === 'function')
    }

    /**
     * @template T
     * @param {T} item
     * @param {import("../types/ResourceConfig.js").ResourceConfig<T>} resourceConfig
     * @returns {Promise<{[k in keyof T]: Awaited<T[k]>}>}
     */
    static async loadPromises(item, resourceConfig) {
        /**
         * @type {Partial<{[k in keyof T]: Awaited<T[k]>}>}
         */
        const itemOut = {}
        for (const k in resourceConfig.attributes) {
            const v = item[k]
            if (tools.isPromise(v)) {
                itemOut[k] = await v
            } else {
                itemOut[k] = v
            }
        }
        return itemOut
    }
}