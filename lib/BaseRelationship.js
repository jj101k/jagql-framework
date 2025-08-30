const Joi = require("joi")

/**
 * @abstract
 */
module.exports = class BaseRelationship {
    /**
     *
     * @param {string} resourceName
     * @returns
     */
    #joiBase(resourceName) {
        return Joi.object().keys({
            id: Joi.string().required(),
            type: Joi.any().required().valid(resourceName),
            meta: Joi.object().optional()
        })
    }

    /**
     * @readonly
     */
    count
    /**
     * @readonly
     */
    resources
    /**
     * @readonly
     * @type {import("joi").Schema}
     */
    schema

    /**
     *
     * @param {"many" | "one"} count
     * @param {string[]} resources
     */
    constructor(count, resources) {
        this.count = count
        this.resources = resources

        switch (count) {
            case "many": {
                this.schema = Joi.array().items(
                    ...resources.map(resourceName => this.#joiBase(resourceName)))
                break
            }
            case "one": {
                this.schema = Joi.alternatives().try(
                    Joi.any().valid(null), // null
                    ...resources.map(resourceName => this.#joiBase(resourceName)),
                )
                break
            }
        }
    }
}