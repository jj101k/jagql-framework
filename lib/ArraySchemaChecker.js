const Joi = require('joi')
const Prop = require('./Prop')
const tools = require('./tools')
const debug = require('./debugging.js')
const responseHelper = require('./responseHelper')

/**
 *
 */
module.exports = class ArraySchemaChecker {
    #compiledSchema
    #resourceConfig

    /**
     * Only check the first 10 items, for basic sanity checks
     */
    #toCheck = 10

    /**
     *
     */
    get exhausted() {
        return this.#toCheck <= 0
    }

    /**
     *
     * @param {import('../types/ResourceConfig').ResourceConfig} resourceConfig
     */
    constructor(resourceConfig) {
        this.#compiledSchema = Joi.compile(Prop.getAllSchemas(resourceConfig))
        this.#resourceConfig = resourceConfig
    }

    /**
     * Checks output data against the schema
     *
     * @template R
     * @param {R[]} items
     */
    async check(...items) {
        if (!this.#toCheck) {
            return
        }
        /**
         * @type {typeof items}
         */
        let checkItems
        if (items.length > this.#toCheck) {
            checkItems = items.slice(0, this.#toCheck)
            this.#toCheck = 0
        } else {
            this.#toCheck -= items.length
            checkItems = items
        }

        for (const cItem of checkItems) {
            const item = await tools.loadPromises(cItem, this.#resourceConfig)
            responseHelper.convertId(item, this.#resourceConfig)

            debug.validationOutput(JSON.stringify(item))
            const validationResult = this.#compiledSchema.validate(item)
            if (validationResult.error) {
                debug.validationError(validationResult.error.message,
                    JSON.stringify(item))
            }
        }
    }
}