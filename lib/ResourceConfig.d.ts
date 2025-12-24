/**
 * @module @jj101k/jsonapi-server
 */
import { Schema } from "joi"
import { BaseRelationship } from "../lib/BaseRelationship.js"
import type { CallbackHandler } from "./handlers/CallbackHandler.d.ts"
import type { PromiseHandler } from "./handlers/PromiseHandler.d.ts"
import { ActionConfig, OurJoiSettings } from "./ourJoi.js"

/**
 *
 */
export type BaseType = {
    /**
     *
     */
    id?: string
    /**
     *
     */
    type: string
}

/**
 *
 */
export type ResourceAttributes<Item> = {
    /**
     *
     */
    [x in keyof Item]: Schema | BaseRelationship
}

/**
 *
 */
export type OptionalResourceAttributes<Item> = {
    /**
     *
     */
    [x in keyof Item]?: Schema
}

/**
 *
 */
interface ResourceConfigOptions {
    /**
     *
     */
    enforceSchemaOnGet?: boolean
}

/**
 *
 */
type PrimaryKeyType = "uuid" | "autoincrement" | "string"

/**
 *
 */
export interface ResourceConfig<Item = any> {
    /**
     *
     */
    actions?: Record<string, ActionConfig>
    /**
     *
     */
    attributes: ResourceAttributes<Partial<Item>>
    /**
     *
     */
    attributeSettings?: Record<string, OurJoiSettings>
    /**
     *
     */
    description?: string,
    /**
     *
     */
    examples: (BaseType & Item & {meta?: any})[]
    /**
     *
     */
    handlers: CallbackHandler<Item> | PromiseHandler<Item>
    /**
     *
     */
    namespace?: string
    /**
     *
     */
    onCreate?: Record<string, Schema | null>
    /**
     *
     */
    options?: ResourceConfigOptions
    /**
     *
     */
    primaryKey: PrimaryKeyType
    /**
     *
     */
    resource: string
    /**
     *
     */
    searchParams?: OptionalResourceAttributes<Item>
}


/**
 *
 */
type PromiseHandlerIn<T> = PromiseHandler<T> & {
    /**
     * @deprecated use initialise
     */
    initialize?: PromiseHandler<T>["initialise"]
}

/**
 *
 */
type CallbackHandlerIn<T> = CallbackHandler<T> & {
    /**
     * @deprecated use initialise
     */
    initialize?: CallbackHandler<T>["initialise"]
}

/**
 *
 */
export interface ResourceConfigIn<T> extends Omit<ResourceConfig<T>, "onCreate"> {
    /**
     *
     */
    handlers: CallbackHandlerIn<T> | PromiseHandlerIn<T>
}