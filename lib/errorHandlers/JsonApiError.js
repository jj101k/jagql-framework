/**
 *
 */
class JsonApiError {
    /**
     * @readonly
     */
    code
    /**
     * @readonly
     */
    detail
    /**
     * @readonly
     */
    status
    /**
     * @readonly
     */
    title

    /**
     *
     * @param {{status: number, code: string, title: string, detail: string}} info
     */
    constructor({status, code, title, detail}) {
        this.code = code
        this.detail = detail
        this.status = status
        this.title = title
    }

    toJSON() {
        return {
            status: "" + this.status,
            code: this.code,
            title: this.title,
            detail: this.detail,
        }
    }
}

module.exports = { JsonApiError }