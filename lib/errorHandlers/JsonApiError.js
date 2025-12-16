/**
 *
 */
export class JsonApiError {
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
    meta
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
     * @param {{status: number, code: string, title: string, detail?: string,
     * meta?: any}} info
     */
    constructor({status, code, title, detail, meta}) {
        this.code = code
        this.detail = detail
        this.meta = meta
        this.status = status
        this.title = title
    }

    toJSON() {
        return {
            status: "" + this.status,
            code: this.code,
            title: this.title,
            detail: this.detail,
            meta: this.meta,
        }
    }
}