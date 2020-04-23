/* istanbul ignore file */
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards

import { RequestHandler, ErrorRequestHandler } from 'express'
import { Readable, Writable } from 'stream'
import { ClassType } from './interfaces'

/**
 * Checks if given object is a Promise or Promise-like.
 * @internal
 */
export function isPromise<T = any>(obj: any): obj is Promise<T> {
	return obj instanceof Promise || (!!obj && typeof obj === 'object' && typeof obj.then === 'function')
}

/**
 * Simply checks if given object is a function to distinguish between a class and its instance.
 * @internal
 */
export function isClass(obj: object): obj is ClassType {
	return typeof obj === 'function'
}

/**
 * Checks if given object is a Readable Stream or Readable Stream-like.
 * @see https://nodejs.org/api/stream.html#stream_class_stream_readable
 * @internal
 */
export function isReadableStream(obj: any): obj is Readable {
	return (
		obj instanceof Readable ||
		(!!obj &&
			typeof obj === 'object' &&
			typeof obj.pipe === 'function' &&
			typeof obj.read === 'function' &&
			typeof obj._readableState === 'object')
	)
}

/**
 * Checks if given object is a Writable Stream or Writable Stream-like.
 * @see https://nodejs.org/api/stream.html#stream_class_stream_writable
 * @internal
 */
export function isWritableStream(obj: any): obj is Writable {
	return (
		obj instanceof Writable ||
		(!!obj &&
			typeof obj === 'object' &&
			typeof obj.pipe === 'function' &&
			typeof obj.write === 'function' &&
			typeof obj._writableState === 'object')
	)
}

/**
 * Checks if given object is an express error handler.
 * @internal
 */
export function isErrorHandler(obj: any): obj is ErrorRequestHandler {
	return typeof obj === 'function' && (obj as Function).length === 4
}

/**
 * Checks if given object is an express `app.use` parameter that contains at least one error handler.
 * @internal
 */
export function isErrorHandlerParams(obj: any): obj is ErrorRequestHandler | (RequestHandler | ErrorRequestHandler)[] {
	return isErrorHandler(obj) || (Array.isArray(obj) && obj.some(isErrorHandler))
}

/**
 * Checks if given value is a path handled by express.
 * @internal
 */
export function isPath(val: any): val is string | RegExp {
	return typeof val === 'string' || val instanceof RegExp
}

/**
 * Checks if given object is an express `app.use` parameter that contains paths only.
 * @internal
 */
export function isPathParams(obj: any): obj is string | RegExp | (string | RegExp)[] {
	return isPath(obj) || (Array.isArray(obj) && obj.every(isPath))
}

/**
 * Checks if given object is Observable-like.
 * @see https://github.com/ReactiveX/rxjs/blob/master/src/internal/util/isObservable.ts
 * @internal
 */
export function isObservable<T = any>(obj: any): obj is Rx.Observable<T> {
	return !!obj && typeof obj.lift === 'function' && typeof obj.subscribe === 'function'
}

namespace Rx {
	/**
	 * @see https://github.com/ReactiveX/rxjs/blob/master/src/internal/Observable.ts
	 * @see https://github.com/ReactiveX/rxjs/blob/master/src/internal/types.ts
	 */
	export interface Observable<T> {
		subscribe(observer?: PartialObserver<T>): Unsubscribable
		subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable
	}

	interface Unsubscribable {
		unsubscribe(): void
	}

	interface NextObserver<T> {
		closed?: boolean
		next: (value: T) => void
		error?: (err: any) => void
		complete?: () => void
	}

	interface ErrorObserver<T> {
		closed?: boolean
		next?: (value: T) => void
		error: (err: any) => void
		complete?: () => void
	}

	interface CompletionObserver<T> {
		closed?: boolean
		next?: (value: T) => void
		error?: (err: any) => void
		complete: () => void
	}

	type PartialObserver<T> = NextObserver<T> | ErrorObserver<T> | CompletionObserver<T>
}
