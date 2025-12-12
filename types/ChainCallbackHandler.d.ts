import {
  CallbackHandler,
  CreateFunction, DeleteFunction, FindFunction,
  HandlerCallback,
  SearchFunction,
  UpdateFunction
} from './CallbackHandler'
import { JsonApiRequest } from "./JsonApiRequest"

type BeforeSearchFunction = SearchFunction
type BeforeFindFunction = FindFunction
type BeforeCreateFunction = CreateFunction
type BeforeDeleteFunction = DeleteFunction
type BeforeUpdateFunction = UpdateFunction

interface AfterSearchFunction<R=any> {
  (request: JsonApiRequest, results: R[], count: number, callback: HandlerCallback<R[], number>): void
}
interface AfterFindFunction<R=any> {
  (request: JsonApiRequest, result: R, callback: HandlerCallback<R>): void
}

interface AfterCreateFunction<R=any> {
  (request: JsonApiRequest, createdResource: R, callback: HandlerCallback<R>): void
}

interface AfterDeleteFunction {
  (request: JsonApiRequest, callback: HandlerCallback<void>): void
}

interface AfterUpdateFunction<R=any> {
  (request: JsonApiRequest, updatedResource: R, callback: HandlerCallback<R>): void
}

/**
 * [[include:chain-handler.md]]
 */
export default class ChainCallbackHandler<R=any> extends CallbackHandler<R>{
  constructor()
  chain(nextHandler: CallbackHandler<R>): this
  beforeInitialise(...args: any[]): any // TODO
  afterInitialise(...args: any[]): any // TODO
  beforeClose(...args: any[]): any // TODO
  afterClose(...args: any[]): any // TODO
  beforeSearch: BeforeSearchFunction
  afterSearch: AfterSearchFunction<R>
  beforeFind: BeforeFindFunction
  afterFind: AfterFindFunction<R>
  beforeCreate: BeforeCreateFunction
  afterCreate: AfterCreateFunction<R>
  beforeUpdate: BeforeUpdateFunction
  afterUpdate: AfterUpdateFunction<R>
  beforeDelete: BeforeDeleteFunction
  afterDelete: AfterDeleteFunction
}