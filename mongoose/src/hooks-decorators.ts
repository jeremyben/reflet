import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ConstructorType, Decorator, Plain } from './interfaces'

//
// ────────────────────────────────────────────────────────────────────────────
//   :::::::: Pre ::::::::
// ────────────────────────────────────────────────────────────────────────────
//

const MetaPreHook = Symbol('pre-hook')

// 1
/**
 * Document middleware (synchronous).
 * - [`Document.init()`](https://mongoosejs.com/docs/api#document_Document-init)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
// `undefined | void` is the only way to forbid promise as a return type.
export function PreHook<T>(method: 'init', callback: (this: T, doc: T) => undefined | void): Decorator.PreHook

// 2
/**
 * Document middleware.
 * - [`Document.validate()`](https://mongoosejs.com/docs/api/document#document_Document-validate)
 * - [`Document.save()`](https://mongoosejs.com/docs/api/document#document_Document-save)
 * - [`Document.remove()`](https://mongoosejs.com/docs/api#model_Model.remove)
 *
 * @remarks
 * - `create()` function fires `'save'` hooks.
 * - `pre('validate')` and `post('validate') `hooks get called before any `pre('save')`.
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, next: HookNextFunction) => void
): Decorator.PreHook

// 3
/**
 * Document middleware by default.
 * - [`Document.remove()`](https://mongoosejs.com/docs/api#model_Model.remove)
 *
 * Can be registered as a query middleware with `{ query: true }` option.
 * - [`Query.remove()`](https://mongoosejs.com/docs/api/query#query_Query-remove)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document: false },
	callback: (this: mongoose.Query<T>, next: HookNextFunction) => void
): Decorator.PreHook

// 4
/**
 * {@inheritDoc (PreHook:3)}
 * @public
 */
export function PreHook<T>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: true },
	callback: (this: T | mongoose.Query<T>, next: HookNextFunction) => void
): Decorator.PreHook

// 5
/**
 * Query middleware.
 * - [`Query.count()`](https://mongoosejs.com/docs/api#query_Query-count)
 * - [`Query.deleteMany()`](https://mongoosejs.com/docs/api#query_Query-deleteMany)
 * - [`Query.deleteOne()`](https://mongoosejs.com/docs/api#query_Query-deleteOne)
 * - [`Query.find()`](https://mongoosejs.com/docs/api#query_Query-find)
 * - [`Query.findOne()`](https://mongoosejs.com/docs/api#query_Query-findOne)
 * - [`Query.findOneAndDelete()`](https://mongoosejs.com/docs/api#query_Query-findOneAndDelete)
 * - [`Query.findOneAndRemove()`](https://mongoosejs.com/docs/api#query_Query-findOneAndRemove)
 * - [`Query.findOneAndUpdate()`](https://mongoosejs.com/docs/api#query_Query-findOneAndUpdate)
 * - [`Query.update()`](https://mongoosejs.com/docs/api#query_Query-update)
 * - [`Query.updateOne()`](https://mongoosejs.com/docs/api#query_Query-updateOne)
 * - [`Query.updateMany()`](https://mongoosejs.com/docs/api#query_Query-updateMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T>(
	method: QueryMethodOnly | QueryMaybeDocumentMethod | (QueryMethodOnly | QueryMaybeDocumentMethod)[],
	callback: (this: mongoose.Query<T>, next: HookNextFunction) => void
): Decorator.PreHook

// 6
/**
 * Query middleware by default.
 * - [`Query.updateOne()`](https://mongoosejs.com/docs/api#query_Query-updateOne)
 * - [`Query.deleteOne()`](https://mongoosejs.com/docs/api#query_Query-deleteOne)
 *
 * Can be registered as a document middleware with `{ document: true }` option.
 * - [`Document.updateOne()`](https://mongoosejs.com/docs/api/document#document_Document-updateOne)
 * - [`Document.deleteOne()`](https://mongoosejs.com/docs/api/model#model_Model-deleteOne)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T>(
	method: QueryMaybeDocumentMethod,
	options: { document: true; query: false },
	callback: (this: T, next: HookNextFunction) => void
): Decorator.PreHook

// 7
/**
 * {@inheritDoc (PreHook:6)}
 * @public
 */
export function PreHook<T>(
	method: QueryMaybeDocumentMethod,
	options: { document: true; query?: true },
	callback: (this: T | mongoose.Query<T>, next: HookNextFunction) => void
): Decorator.PreHook

// 8
/**
 * Model middleware.
 * - [`Model.insertMany()`](https://mongoosejs.com/docs/api#model_Model.insertMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T>(
	method: ModelMethod,
	callback: (this: mongoose.Model<T & mongoose.Document>, next: HookNextFunction) => void
): Decorator.PreHook

// 9
/**
 * Aggregate middleware.
 * - [`Model.aggregate()`](https://mongoosejs.com/docs/api#model_Model.aggregate)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#aggregate
 * @public
 */
export function PreHook<T>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, next: HookNextFunction) => void
): Decorator.PreHook

// 10
/**
 * Mixed methods middleware.
 *
 * In the case of a Regex or mixed type middlewares, `this` will refer
 * to either the document, the query, the model, or the aggregate,
 * so you might need to assert its type before using it.
 *
 * @see https://mongoosejs.com/docs/api/schema#schema_Schema-pre
 *
 * @example
 * ```ts
 * ＠Model()
 * ＠Pre<User>(['find', 'aggregate'], function(this: mongoose.Query<User> | mongoose.Aggregate<User>, next) {
 *   if (this instanceof mongoose.Query) {
 *     //...
 *   }
 *   next()
 * })
 * class User extends Model.Interface {}
 * ```
 * ---
 * @public
 */
export function PreHook<T>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, next: HookNextFunction) => void
): Decorator.PreHook

// 11
/**
 * {@inheritDoc (PreHook:10)}
 * @public
 */
export function PreHook<T>(
	method: (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod | 'init')[],
	callback: (this: unknown, nextOrDoc: HookNextFunction | T) => void
): Decorator.PreHook

// Implementation
export function PreHook(
	method: string | string[] | RegExp,
	callbackOrOptions: Function | { document?: boolean; query?: boolean },
	callbackIfOptions?: Function
): Decorator.PreHook {
	return (Class) => {
		checkDecoratorsOrder(Class)
		const preHooks = getPreHooks(Class)
		preHooks.push({ method, callbackOrOptions, callbackIfOptions })
		Reflect.defineMetadata(MetaPreHook, preHooks, Class)
	}
}

/**
 * @internal
 */
export function applyPreHooks(schema: mongoose.Schema, target: ConstructorType): void {
	const preHooks = getPreHooks(target)

	for (const preHook of preHooks) {
		;(schema.pre as Function)(preHook.method, preHook.callbackOrOptions, preHook.callbackIfOptions)
	}
}

/**
 * @internal
 */
function getPreHooks(target: ConstructorType): Hook[] {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return (Reflect.getMetadata(MetaPreHook, target) || []).slice()
}

//
// ────────────────────────────────────────────────────────────────────────────
//   :::::::: Post ::::::::
// ────────────────────────────────────────────────────────────────────────────
//

const MetaPostHook = Symbol('post-hook')

// 1
/**
 * Document middleware (synchronous).
 * - [`Document.init()`](https://mongoosejs.com/docs/api#document_Document-init)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
// `undefined | void` is the only way to forbid promise as a return type.
export function PostHook<T>(method: 'init', callback: (this: T, doc: T) => undefined | void): Decorator.PostHook

// 2
/**
 * Document middleware.
 * - [`Document.validate()`](https://mongoosejs.com/docs/api/document#document_Document-validate)
 * - [`Document.save()`](https://mongoosejs.com/docs/api/document#document_Document-save)
 * - [`Document.remove()`](https://mongoosejs.com/docs/api#model_Model.remove)
 *
 * @remarks
 * - `create()` function fires `'save'` hooks.
 * - `pre('validate')` and `post('validate') `hooks get called before any `pre('save')`.
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 3
/**
 * {@inheritDoc (PostHook:2)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, error: TError, result: null, next: HookNextFunction) => void
): Decorator.PostHook

// 4
/**
 * Document middleware by default.
 * - [`Document.remove()`](https://mongoosejs.com/docs/api#model_Model.remove)
 *
 * Can be registered as a query middleware with `{ query: true }` option.
 * - [`Query.remove()`](https://mongoosejs.com/docs/api/query#query_Query-remove)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document: false },
	callback: (this: mongoose.Query<T>, result: DeleteWriteOpResultResult, next: HookNextFunction) => void
): Decorator.PostHook

// 5
/**
 * {@inheritDoc (PostHook:4)}
 * @public
 */
export function PostHook<T>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: true },
	callback: (this: T | mongoose.Query<T>, result: T | DeleteWriteOpResultResult, next: HookNextFunction) => void
): Decorator.PostHook

// 6
/**
 * {@inheritDoc (PostHook:4)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: boolean },
	callback: (this: T | mongoose.Query<T>, error: TError, result: null, next: HookNextFunction) => void
): Decorator.PostHook

// 7
/**
 * Query middleware.
 * - [`Query.findOne()`](https://mongoosejs.com/docs/api#query_Query-findOne)
 * - [`Query.findOneAndDelete()`](https://mongoosejs.com/docs/api#query_Query-findOneAndDelete)
 * - [`Query.findOneAndRemove()`](https://mongoosejs.com/docs/api#query_Query-findOneAndRemove)
 * - [`Query.findOneAndUpdate()`](https://mongoosejs.com/docs/api#query_Query-findOneAndUpdate)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'findOne' | 'findOneAndUpdate' | 'findOneAndDelete' | 'findOneAndRemove',
	callback: (this: mongoose.Query<T>, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 8
/**
 * Query middleware.
 * - [`Query.find()`](https://mongoosejs.com/docs/api#query_Query-find)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'find',
	callback: (this: mongoose.Query<T>, results: T[], next: HookNextFunction) => void
): Decorator.PostHook

// 9
/**
 * Query middleware.
 * - [`Query.update()`](https://mongoosejs.com/docs/api#query_Query-update)
 * - [`Query.updateMany()`](https://mongoosejs.com/docs/api#query_Query-updateMany)
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'update' | 'updateMany',
	callback: (this: mongoose.Query<T>, result: UpdateWriteOpResultResult, next: HookNextFunction) => void
): Decorator.PostHook

// 10
/**
 * Query middleware.
 * - [`Query.deleteMany()`](https://mongoosejs.com/docs/api#query_Query-deleteMany)
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'deleteMany',
	callback: (this: mongoose.Query<T>, result: DeleteWriteOpResultResult, next: HookNextFunction) => void
): Decorator.PostHook

// 11
/**
 * Query middleware.
 * - [`Query.count()`](https://mongoosejs.com/docs/api#query_Query-count)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'count',
	callback: (this: mongoose.Query<T>, result: number, next: HookNextFunction) => void
): Decorator.PostHook

// 12
/**
 * Query middleware.
 * - [`Query.count()`](https://mongoosejs.com/docs/api#query_Query-count)
 * - [`Query.deleteMany()`](https://mongoosejs.com/docs/api#query_Query-deleteMany)
 * - [`Query.deleteOne()`](https://mongoosejs.com/docs/api#query_Query-deleteOne)
 * - [`Query.find()`](https://mongoosejs.com/docs/api#query_Query-find)
 * - [`Query.findOne()`](https://mongoosejs.com/docs/api#query_Query-findOne)
 * - [`Query.findOneAndDelete()`](https://mongoosejs.com/docs/api#query_Query-findOneAndDelete)
 * - [`Query.findOneAndRemove()`](https://mongoosejs.com/docs/api#query_Query-findOneAndRemove)
 * - [`Query.findOneAndUpdate()`](https://mongoosejs.com/docs/api#query_Query-findOneAndUpdate)
 * - [`Query.update()`](https://mongoosejs.com/docs/api#query_Query-update)
 * - [`Query.updateOne()`](https://mongoosejs.com/docs/api#query_Query-updateOne)
 * - [`Query.updateMany()`](https://mongoosejs.com/docs/api#query_Query-updateMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T, TError = any>(
	method: QueryMethodOnly | (QueryMethodOnly | QueryMaybeDocumentMethod)[],
	callback: (this: mongoose.Query<T>, error: TError, result: null, next: HookNextFunction) => void
): Decorator.PostHook

// 13
/**
 * Query middleware by default.
 * - [`Query.updateOne()`](https://mongoosejs.com/docs/api#query_Query-updateOne)
 *
 * Can be registered as a document middleware with `{ document: true }` option.
 * - [`Document.updateOne()`](https://mongoosejs.com/docs/api/document#document_Document-updateOne)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'updateOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T>, result: UpdateWriteOpResultResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 14
/**
 * {@inheritDoc (PostHook:13)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: 'updateOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T>, error: TError, result: UpdateWriteOpResultResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, error: TError, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 15
/**
 * Query middleware by default.
 * - [`Query.deleteOne()`](https://mongoosejs.com/docs/api#query_Query-deleteOne)
 *
 * Can be registered as a document middleware with `{ document: true }` option.
 * - [`Document.deleteOne()`](https://mongoosejs.com/docs/api/model#model_Model-deleteOne)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: 'deleteOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T>, result: DeleteWriteOpResultResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 16
/**
 * {@inheritDoc (PostHook:15)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: 'deleteOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T>, error: TError, result: DeleteWriteOpResultResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, error: TError, result: T, next: HookNextFunction) => void
): Decorator.PostHook

// 17
/**
 * Model middleware.
 * - [`Model.insertMany()`](https://mongoosejs.com/docs/api#model_Model.insertMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T>(
	method: ModelMethod,
	callback: (this: mongoose.Model<T & mongoose.Document>, results: T[], next: HookNextFunction) => void
): Decorator.PostHook

// 18
/**
 * {@inheritDoc (PostHook:17)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: ModelMethod,
	callback: (this: mongoose.Model<T & mongoose.Document>, error: TError, results: T[], next: HookNextFunction) => void
): Decorator.PostHook

// 19
/**
 * Aggregate middleware.
 * - [`Model.aggregate()`](https://mongoosejs.com/docs/api#model_Model.aggregate)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#aggregate
 * @public
 */
export function PostHook<T>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, results: Plain<T>[], next: HookNextFunction) => void
): Decorator.PostHook

// 20
/**
 * {@inheritDoc (PostHook:19)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, error: TError, results: undefined, next: HookNextFunction) => void
): Decorator.PostHook

// 21
/**
 * Mixed methods middleware.
 *
 * In the case of a Regex or mixed type middleware, `this` will refer
 * to either the document, the query, the model, or the aggregate,
 * so you might need to assert its type before using it.
 *
 * @see https://mongoosejs.com/docs/api/schema#schema_Schema-post
 *
 * @example
 * ```ts
 * ＠Model()
 * ＠Post<User>(['find', 'aggregate'], function(this: mongoose.Query<User> | mongoose.Aggregate<User>, result, next) {
 *   if (this instanceof mongoose.Query) {
 *     //...
 *   }
 *   next()
 * })
 * class User extends Model.Interface {}
 * ```
 * ---
 * @public
 */
export function PostHook<T>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, result: unknown, next: HookNextFunction) => void
): Decorator.PreHook

// 22
/**
 * {@inheritDoc (PostHook:21)}
 * @public
 */
export function PostHook<T, TError = any>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, error: TError, result: unknown, next: HookNextFunction) => void
): Decorator.PreHook

// Implementation
export function PostHook(
	method: string | string[] | RegExp,
	callbackOrOptions: Function | { document?: boolean; query?: boolean },
	callbackIfOptions?: Function
): Decorator.PostHook {
	return (Class) => {
		checkDecoratorsOrder(Class)
		const postHooks = getPostHooks(Class)
		postHooks.push({ method, callbackOrOptions, callbackIfOptions })
		Reflect.defineMetadata(MetaPostHook, postHooks, Class)
	}
}

/**
 * @internal
 */
export function applyPostHooks(schema: mongoose.Schema, target: ConstructorType): void {
	const postHooks = getPostHooks(target)

	for (const postHook of postHooks) {
		;(schema.post as Function)(postHook.method, postHook.callbackOrOptions, postHook.callbackIfOptions)
	}
}

/**
 * @internal
 */
function getPostHooks(target: ConstructorType): Hook[] {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return (Reflect.getMetadata(MetaPostHook, target) || []).slice()
}

//
// ────────────────────────────────────────────────────────────────────────────
//   :::::::: Types ::::::::
// ────────────────────────────────────────────────────────────────────────────
//

/**
 * @public
 */
type Hook = {
	method: string | string[] | RegExp
	callbackOrOptions: Function | { document?: boolean; query?: boolean }
	callbackIfOptions?: Function
}

/**
 * @public
 */
type DocumentMethod = 'validate' | 'save' | 'remove' | 'updateOne' | 'deleteOne'

/**
 * @public
 */
type QueryMethod =
	| 'count'
	| 'deleteMany'
	| 'deleteOne'
	| 'find'
	| 'findOne'
	| 'findOneAndDelete'
	| 'findOneAndRemove'
	| 'findOneAndUpdate'
	| 'remove'
	| 'update'
	| 'updateOne'
	| 'updateMany'

/**
 * @public
 */
type DocumentMethodOnly = Exclude<DocumentMethod, QueryMethod>

/**
 * @public
 */
type QueryMethodOnly = Exclude<QueryMethod, DocumentMethod>

/**
 * @public
 */
type DocumentMayBeQueryMethod = 'remove'

/**
 * @public
 */
type QueryMaybeDocumentMethod = 'updateOne' | 'deleteOne'

/**
 * @public
 */
type ModelMethod = 'insertMany'

/**
 * @public
 */
type AggregateMethod = 'aggregate'

/**
 * @public
 */
type HookNextFunction = (err?: Error) => void

/**
 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection#~updateWriteOpResult
 * @public
 */
interface UpdateWriteOpResultResult {
	ok: number
	n: number
	nModified: number
}

/**
 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection#~deleteWriteOpResult
 * @public
 */
interface DeleteWriteOpResultResult {
	n: number
	ok: number
	deletedCount: number
}
