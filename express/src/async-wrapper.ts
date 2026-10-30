import * as express from 'express'

const ORIGINAL = Symbol('original')

/**
 * Forwards errors of promise-returning middlewares and error handlers to `next`.
 *
 * Wraps every handler regardless of the `async` modifier, so that plain functions returning a promise,
 * or async functions transpiled to an older target, don't produce unhandled rejections.
 * @internal
 */
export function wrapAsync<T extends express.RequestHandler | express.ErrorRequestHandler>(handler: T): T {
	// Arrays of handlers are flattened by express, so we wrap each of them.
	// They can mix request and error handlers (e.g. `finalHandler` with `notFoundHandler`).
	if (Array.isArray(handler)) {
		return handler.map(wrapAsync) as unknown as T
	}

	// Express applications and routers are left as is,
	// as they must be recognized by `app.use` (e.g. to mount sub-applications).
	if (typeof handler !== 'function' || isWrapped(handler) || typeof (handler as any).handle === 'function') {
		return handler
	}

	// Keep the arity for express to tell error handlers from request handlers,
	// whether they are passed to `@Use` or `@Catch` (e.g. a not found handler).
	if (handler.length === 4) {
		const errorHandler = handler as express.ErrorRequestHandler

		const wrapper: express.ErrorRequestHandler = (error, req, res, next) => {
			return forwardRejection(errorHandler(error, req, res, next), next)
		}

		return markWrapped(wrapper as T, handler)
	}

	const requestHandler = handler as express.RequestHandler

	const wrapper: express.RequestHandler = (req, res, next) => {
		return forwardRejection(requestHandler(req, res, next), next)
	}

	return markWrapped(wrapper as T, handler)
}

/**
 * Forwards the rejection of a returned promise to `next`.
 *
 * Only native promises are caught (returned by async functions, even transpiled ones),
 * not every thenable, to avoid triggering lazy thenables like query builders
 * that are returned without being meant to be executed.
 * @internal
 */
export function forwardRejection(result: unknown, next: express.NextFunction): unknown {
	return result instanceof Promise ? result.catch(nextOnRejection(next)) : result
}

/**
 * Passes the rejection reason to `next`, and makes sure a falsy reason (e.g. `Promise.reject()`)
 * is still treated as an error instead of moving on to the next handler, like express 5 does.
 * @internal
 */
export function nextOnRejection(next: express.NextFunction) {
	return (reason: unknown) => next(reason || new Error('Rejected promise'))
}

/**
 * Retrieves the original handler, to compare by reference or by name.
 * @internal
 */
export function unwrap<T extends Function>(handler: T): T {
	return typeof handler === 'function' && isWrapped(handler) ? (handler as any)[ORIGINAL] : handler
}

/**
 * @internal
 */
function isWrapped(handler: Function): boolean {
	return Object.prototype.hasOwnProperty.call(handler, ORIGINAL)
}

/**
 * @internal
 */
function markWrapped<T extends Function>(wrapper: T, original: Function): T {
	Object.defineProperty(wrapper, ORIGINAL, { value: original })
	// Keep the original name for express layers and stack traces.
	Object.defineProperty(wrapper, 'name', { value: original.name, configurable: true })
	return wrapper
}
