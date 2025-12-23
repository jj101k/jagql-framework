import Joi from "joi"
import { debug } from "./debug.js"
import { Prop } from "./Prop.js"
import { tools } from "./tools.js"

/**
 *
 */
export class ArraySchemaChecker {
    /**
     *
     */
    #compiledSchema
    /**
     *
     */
    #resourceConfig
    /**
     *
     */
    #responseHelper

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
     * @param {import("../types/ResourceConfig.js").ResourceConfig} resourceConfig
     * @param {import("./responseHelper.js").responseHelper} responseHelper
     */
    constructor(resourceConfig, responseHelper) {
        this.#compiledSchema = Joi.compile(Prop.getAllSchemas(resourceConfig))
        this.#resourceConfig = resourceConfig
        this.#responseHelper = responseHelper
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
            this.#responseHelper.convertId(item, this.#resourceConfig)

            debug.validationOutput(JSON.stringify(item))
            const validationResult = this.#compiledSchema.validate(item)
            if (validationResult.error) {
                debug.validationError(validationResult.error.message,
                    JSON.stringify(item))
            }
        }
    }
}