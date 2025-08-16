/**
 * @module @jagql/framework
 */
import {Schema} from 'joi'
import {CallbackHandler as CallbackHandler} from './CallbackHandler'
import { ActionConfig, OurJoiSettings } from "./ourJoi"
import Relation from "../lib/Relation"

export type BaseType = {
  id?: string
  type: string
}

export type ResourceAttributes<Item> = {
  [x in keyof Item]: Schema | Relation
}

export type OptionalResourceAttributes<Item> = {
  [x in keyof Item]?: Schema
}

interface ResourceConfigOptions {
  enforceSchemaOnGet?: boolean
}

type PrimaryKeyType = 'uuid' | 'autoincrement' | 'string'

export interface ResourceConfig<Item = any> {
  actions?: Record<string, ActionConfig>
  namespace?: string,
  options?: ResourceConfigOptions,
  description?: string,
  resource: string,
  handlers: CallbackHandler<Item>
  primaryKey: PrimaryKeyType,
  attributes: ResourceAttributes<Partial<Item>>
  attributeSettings?: Record<string, OurJoiSettings>
  examples: (BaseType & Item)[]
  searchParams?: OptionalResourceAttributes<Item>
}
