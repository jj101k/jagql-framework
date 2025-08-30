/// <reference types="joi" />
/**
 * @module @jagql/framework/lib/ourJoi
 */
import { AnySchema, FunctionSchema, Schema } from 'joi'
import BaseJoi = require('joi')
import Relationship from "../lib/Relationship"

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

export const Joi: OurJoi