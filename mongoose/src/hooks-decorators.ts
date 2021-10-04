import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb'
import { checkDecoratorsOrder } from './check-decorator-order'
import { AsDocument, ClassType, DocumentAny } from './interfaces'

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
export function PreHook<T extends DocumentAny>(
	method: 'init',
	callback: (this: T, doc: T) => undefined | void
): PreHook.Decorator

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
export function PreHook<T extends DocumentAny>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, next: HookNextFunction) => void
): PreHook.Decorator

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
export function PreHook<T extends DocumentAny>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document: false },
	callback: (this: mongoose.Query<T, T>, next: HookNextFunction) => void
): PreHook.Decorator

// 4
/**
 * {@inheritDoc (PreHook:3)}
 * @public
 */
export function PreHook<T extends DocumentAny>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: true },
	callback: (this: T | mongoose.Query<T, T>, next: HookNextFunction) => void
): PreHook.Decorator

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
export function PreHook<T extends DocumentAny>(
	method: QueryMethodOnly | QueryMaybeDocumentMethod | (QueryMethodOnly | QueryMaybeDocumentMethod)[],
	callback: (this: mongoose.Query<T, T>, next: HookNextFunction) => void
): PreHook.Decorator

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
export function PreHook<T extends DocumentAny>(
	method: QueryMaybeDocumentMethod,
	options: { document: true; query: false },
	callback: (this: T, next: HookNextFunction) => void
): PreHook.Decorator

// 7
/**
 * {@inheritDoc (PreHook:6)}
 * @public
 */
export function PreHook<T extends DocumentAny>(
	method: QueryMaybeDocumentMethod,
	options: { document: true; query?: true },
	callback: (this: T | mongoose.Query<T, T>, next: HookNextFunction) => void
): PreHook.Decorator

// 8
/**
 * Model middleware.
 * - [`Model.insertMany()`](https://mongoosejs.com/docs/api#model_Model.insertMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#pre
 * @public
 */
export function PreHook<T extends DocumentAny>(
	method: ModelMethod,
	callback: (this: mongoose.Model<AsDocument<T>>, next: HookNextFunction) => void
): PreHook.Decorator

// 9
/**
 * Aggregate middleware.
 * - [`Model.aggregate()`](https://mongoosejs.com/docs/api#model_Model.aggregate)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#aggregate
 * @public
 */
export function PreHook<T extends DocumentAny>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, next: HookNextFunction) => void
): PreHook.Decorator

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
export function PreHook<T extends DocumentAny>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, next: HookNextFunction) => void
): PreHook.Decorator

// 11
/**
 * {@inheritDoc (PreHook:10)}
 * @public
 */
export function PreHook<T extends DocumentAny>(
	method: (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod | 'init')[],
	callback: (this: unknown, nextOrDoc: HookNextFunction | T) => void
): PreHook.Decorator

// Implementation
export function PreHook(
	method: string | string[] | RegExp,
	callbackOrOptions: Function | { document?: boolean; query?: boolean },
	callbackIfOptions?: Function
): PreHook.Decorator {
	return (Class) => {
		checkDecoratorsOrder(Class)
		const preHooks = getPreHooks(Class)
		preHooks.push({ method, callbackOrOptions, callbackIfOptions })
		Reflect.defineMetadata(MetaPreHook, preHooks, Class)
	}
}

export namespace PreHook {
	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongoosePreHook?: never
	}
}

/**
 * @internal
 */
export function applyPreHooks(schema: mongoose.Schema<any>, target: ClassType): void {
	const preHooks = getPreHooks(target)

	for (const preHook of preHooks) {
		;(schema.pre as Function)(preHook.method, preHook.callbackOrOptions, preHook.callbackIfOptions)
	}
}

/**
 * @internal
 */
function getPreHooks(target: Function): Hook[] {
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
export function PostHook<T extends DocumentAny>(
	method: 'init',
	callback: (this: T, doc: T) => undefined | void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, result: T, next: HookNextFunction) => void
): PostHook.Decorator

// 3
/**
 * {@inheritDoc (PostHook:2)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: DocumentMethodOnly | DocumentMayBeQueryMethod | (DocumentMethodOnly | DocumentMayBeQueryMethod)[],
	callback: (this: T, error: TError, result: null, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document: false },
	callback: (this: mongoose.Query<T, T>, result: mongodb.DeleteResult, next: HookNextFunction) => void
): PostHook.Decorator

// 5
/**
 * {@inheritDoc (PostHook:4)}
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: true },
	callback: (this: T | mongoose.Query<T, T>, result: T | mongodb.DeleteResult, next: HookNextFunction) => void
): PostHook.Decorator

// 6
/**
 * {@inheritDoc (PostHook:4)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: DocumentMayBeQueryMethod,
	options: { query: true; document?: boolean },
	callback: (this: T | mongoose.Query<T, T>, error: TError, result: null, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: 'findOne' | 'findOneAndUpdate' | 'findOneAndDelete' | 'findOneAndRemove',
	callback: (this: mongoose.Query<T, T>, result: T, next: HookNextFunction) => void
): PostHook.Decorator

// 8
/**
 * Query middleware.
 * - [`Query.find()`](https://mongoosejs.com/docs/api#query_Query-find)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: 'find',
	callback: (this: mongoose.Query<T, T>, results: T[], next: HookNextFunction) => void
): PostHook.Decorator

// 9
/**
 * Query middleware.
 * - [`Query.update()`](https://mongoosejs.com/docs/api#query_Query-update)
 * - [`Query.updateMany()`](https://mongoosejs.com/docs/api#query_Query-updateMany)
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: 'update' | 'updateMany',
	callback: (this: mongoose.Query<T, T>, result: mongodb.UpdateResult, next: HookNextFunction) => void
): PostHook.Decorator

// 10
/**
 * Query middleware.
 * - [`Query.deleteMany()`](https://mongoosejs.com/docs/api#query_Query-deleteMany)
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: 'deleteMany',
	callback: (this: mongoose.Query<T, T>, result: mongodb.DeleteResult, next: HookNextFunction) => void
): PostHook.Decorator

// 11
/**
 * Query middleware.
 * - [`Query.count()`](https://mongoosejs.com/docs/api#query_Query-count)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: 'count',
	callback: (this: mongoose.Query<T, T>, result: number, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny, TError = any>(
	method: QueryMethodOnly | (QueryMethodOnly | QueryMaybeDocumentMethod)[],
	callback: (this: mongoose.Query<T, T>, error: TError, result: null, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: 'updateOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T, T>, result: mongodb.UpdateResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, result: T, next: HookNextFunction) => void
): PostHook.Decorator

// 14
/**
 * {@inheritDoc (PostHook:13)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: 'updateOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T, T>, error: TError, result: mongodb.UpdateResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, error: TError, result: T, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: 'deleteOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T, T>, result: mongodb.DeleteResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, result: T, next: HookNextFunction) => void
): PostHook.Decorator

// 16
/**
 * {@inheritDoc (PostHook:15)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: 'deleteOne',
	callbackOrOptions:
		| ((this: mongoose.Query<T, T>, error: TError, result: mongodb.DeleteResult, next: HookNextFunction) => void)
		| { document: true; query?: false },
	callbackIfOptions?: (this: T, error: TError, result: T, next: HookNextFunction) => void
): PostHook.Decorator

// 17
/**
 * Model middleware.
 * - [`Model.insertMany()`](https://mongoosejs.com/docs/api#model_Model.insertMany)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#post
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: ModelMethod,
	callback: (this: mongoose.Model<AsDocument<T>>, results: T[], next: HookNextFunction) => void
): PostHook.Decorator

// 18
/**
 * {@inheritDoc (PostHook:17)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: ModelMethod,
	callback: (this: mongoose.Model<AsDocument<T>>, error: TError, results: T[], next: HookNextFunction) => void
): PostHook.Decorator

// 19
/**
 * Aggregate middleware.
 * - [`Model.aggregate()`](https://mongoosejs.com/docs/api#model_Model.aggregate)
 *
 * ---
 * @see https://mongoosejs.com/docs/middleware#aggregate
 * @public
 */
export function PostHook<T extends DocumentAny>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, results: mongoose.LeanDocument<T>[], next: HookNextFunction) => void
): PostHook.Decorator

// 20
/**
 * {@inheritDoc (PostHook:19)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: AggregateMethod,
	callback: (this: mongoose.Aggregate<T>, error: TError, results: undefined, next: HookNextFunction) => void
): PostHook.Decorator

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
export function PostHook<T extends DocumentAny>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, result: unknown, next: HookNextFunction) => void
): PreHook.Decorator

// 22
/**
 * {@inheritDoc (PostHook:21)}
 * @public
 */
export function PostHook<T extends DocumentAny, TError = any>(
	method: RegExp | (DocumentMethod | QueryMethod | AggregateMethod | ModelMethod)[],
	callback: (this: unknown, error: TError, result: unknown, next: HookNextFunction) => void
): PreHook.Decorator

// Implementation
export function PostHook(
	method: string | string[] | RegExp,
	callbackOrOptions: Function | { document?: boolean; query?: boolean },
	callbackIfOptions?: Function
): PostHook.Decorator {
	return (Class) => {
		checkDecoratorsOrder(Class)
		const postHooks = getPostHooks(Class)
		postHooks.push({ method, callbackOrOptions, callbackIfOptions })
		Reflect.defineMetadata(MetaPostHook, postHooks, Class)
	}
}

export namespace PostHook {
	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongoosePostHook?: never
	}
}

/**
 * @internal
 */
export function applyPostHooks(schema: mongoose.Schema<any>, target: ClassType): void {
	const postHooks = getPostHooks(target)

	for (const postHook of postHooks) {
		;(schema.post as Function)(postHook.method, postHook.callbackOrOptions, postHook.callbackIfOptions)
	}
}

/**
 * @internal
 */
function getPostHooks(target: Function): Hook[] {
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
