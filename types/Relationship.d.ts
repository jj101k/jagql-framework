import { LocalRelationship } from "./LocalRelationship.js"
import { ModelOptions } from "./ourJoi.js"
import { RemoteRelationship } from "./RemoteRelationship.js"

/**
 *
 */
export class Relationship {
    /**
     *
     * @param config
     * @returns
     */
    static belongsToOneOf(config: ModelOptions): RemoteRelationship
    /**
     *
     * @param config
     * @returns
     */
    static belongsToManyOf(config: ModelOptions): RemoteRelationship

    /**
     *
     * @param resourceOrResources
     * @param required
     * @param uidType
     * @returns
     */
    static manyOf(resourceOrResources: string | string[], required?: boolean, uidType?: "string" | "uuid" | "autoincrement"): LocalRelationship
    /**
     *
     * @param resourceOrResources
     * @param required
     * @param uidType
     * @returns
     */
    static oneOf(resourceOrResources: string | string[], required?: boolean, uidType?: "string" | "uuid" | "autoincrement"): LocalRelationship
}