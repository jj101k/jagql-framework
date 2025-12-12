import { LocalRelationship } from "./LocalRelationship"
import { ModelOptions } from "./ourJoi"
import { RemoteRelationship } from "./RemoteRelationship"

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