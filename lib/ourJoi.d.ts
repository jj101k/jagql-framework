/// <reference types="joi" />
/**
 * @module @jj101k/jsonapi-server/lib/ourJoi
 */
import BaseJoi, { AnySchema, Schema } from "joi"
import { ModelOptions } from "./ModelOptions.js"
import { RelationshipStore } from "./RelationshipStore.js"

type UidType = "uuid" | "autoincrement"

export interface OurJoiSchema extends AnySchema {
    uidType(type: UidType): this
}
interface ActionConfig {
    params: {
        [x: string]: Schema
    }
    get?()
    post?()
}
interface OurJoi extends BaseJoi.Root {
    one(...model: string[]): OurJoiSchema
    many(...model: string[]): OurJoiSchema
    belongsToOne(modelOpts: ModelOptions): OurJoiSchema
    belongsToMany(modelOpts: ModelOptions): OurJoiSchema
}

/**
 *
 */
export interface OurJoiSettings {
    /**
     *
     */
    origin: "json-api-server"
    /**
     *
     */
    relationshipId?: number
}

/**
 *
 */
export class ourJoi {
    /**
     *
     * @param relationshipStore
     */
    static build(relationshipStore: RelationshipStore): OurJoi
}