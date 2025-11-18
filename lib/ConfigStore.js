/**
 *
 */
class ConfigStore {
    /**
     * @readonly
     */
    static inst = new ConfigStore()

    /**
     * @type {import("../types/jsonApi.js").ApiConfig}
     */
    config
}

module.exports = ConfigStore