/// <reference types="joi" />
/**
 * @module @jagql/framework/lib/ourJoi
 */
import { AnySchema, FunctionSchema, Schema } from 'joi'
import BaseJoi = require('joi')

type UidType = 'uuid' | 'autoincrement'

interface OurJoiSchema extends AnySchema {
  uidType(type: UidType): this
}
interface ActionConfig {
  params: {
    [x: string]: Schema
  }
  get?()
  post?()
}
interface ModelOptions {
  resource: string
  as: string
}
interface OurJoi extends BaseJoi.Root {
  one(...model: string[]): OurJoiSchema
  many(...model: string[]): OurJoiSchema
  belongsToOne(modelOpts: ModelOptions): OurJoiSchema
  belongsToMany(modelOpts: ModelOptions): OurJoiSchema
  action(config: ActionConfig): FunctionSchema
}

export interface OurJoiSettings {
  _jagql: true
  __one?: string[]
  __many?: string[]
  _uidType?: string
}

export const Joi: OurJoi