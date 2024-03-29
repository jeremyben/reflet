/* istanbul ignore file */
// https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards

import * as express from 'express'
import { Readable, Writable } from 'stream'
import { IncomingMessage, ServerResponse } from 'http'
import { ClassType } from './interfaces'

/**
 * Checks if given object is a Promise or Promise-like.
 * @internal
 */
export function isPromise<T = any>(obj: any): obj is Promise<T> {
	return obj instanceof Promise || (!!obj && typeof obj === 'object' && typeof obj.then === 'function')
}

/**
 * @internal
 */
export function isAsyncFunction<T extends (...args: any[]) => any>(
	value: any
): value is (...args: Parameters<T>) => Promise<ReturnType<T>> {
	return value[Symbol.toStringTag] === 'AsyncFunction'
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
 * @see https://nodejs.org/api/stream.html#class-streamreadable
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
 * @see https://nodejs.org/api/stream.html#class-streamwritable
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
 * @internal
 */
export function isExpressApp(obj: any): obj is express.Application {
	return typeof obj === 'function' && obj.request instanceof IncomingMessage && obj.response instanceof ServerResponse
}

/**
 * @internal
 */
export function isExpressRouter(obj: any): obj is express.Router {
	return Object.getPrototypeOf(obj) === express.Router
}

/**
 * Checks if given object is an express error handler.
 * @internal
 */
export function isErrorHandler(obj: any): obj is express.ErrorRequestHandler {
	return typeof obj === 'function' && (obj as Function).length === 4
}

/**
 * Checks if given object is an express `app.use` parameter that contains at least one error handler.
 * @internal
 */
export function isErrorHandlerParams(
	obj: any
): obj is express.ErrorRequestHandler | (express.RequestHandler | express.ErrorRequestHandler)[] {
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
