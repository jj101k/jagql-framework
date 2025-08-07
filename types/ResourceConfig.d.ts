/**
 * @module @jagql/framework
 */
import {Schema} from 'joi'
import {Handler} from './Handler'
import { OurJoiSettings } from "./ourJoi"

export type BaseType = {
  id?: string
  type: string
}

export type ResourceAttributes<Item> = {
  [x in keyof Item]: Schema
}

export type OptionalResourceAttributes<Item> = {
  [x in keyof Item]?: Schema
}

interface ResourceConfigOptions {
  enforceSchemaOnGet?: boolean
}

type PrimaryKeyType = 'uuid' | 'autoincrement' | 'string'

export interface ResourceConfig<Item = any> {
  actions?: Record<string, Schema>
  namespace?: string,
  options?: ResourceConfigOptions,
  description?: string,
  resource: string,
  handlers: Handler<Item>
  primaryKey: PrimaryKeyType,
  attributes: ResourceAttributes<Partial<Item>>
  attributeSettings?: Record<string, OurJoiSettings>
  examples: (BaseType & Item)[]
  searchParams?: OptionalResourceAttributes<Item>
}
