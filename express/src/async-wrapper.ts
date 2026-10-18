import * as express from 'express'

const ORIGINAL = Symbol('original')

/**
 * Forwards errors of promise-returning middlewares to `next`.
 *
 * Wraps every handler regardless of the `async` modifier, so that plain functions returning a promise,
 * or async functions transpiled to an older target, don't produce unhandled rejections.
 * @internal
 */
export function wrapAsync(handler: express.RequestHandler): express.RequestHandler {
	// Arrays of handlers are flattened by express, so we wrap each of them.
	if (Array.isArray(handler)) {
		return handler.map(wrapAsync) as unknown as express.RequestHandler
	}

	// Express applications and routers are left as is,
	// as they must be recognized by `app.use` (e.g. to mount sub-applications).
	if (typeof handler !== 'function' || isWrapped(handler) || typeof (handler as any).handle === 'function') {
		return handler
	}

	// Keep the arity for express to recognize error handlers passed by mistake to `@Use`.
	if (handler.length === 4) {
		return wrapAsyncError(handler as unknown as express.ErrorRequestHandler) as unknown as express.RequestHandler
	}

	const wrapper: express.RequestHandler = (req, res, next) => {
		return forwardRejection(handler(req, res, next), next)
	}

	return markWrapped(wrapper, handler)
}

/**
 * Forwards errors of promise-returning error handlers to `next`.
 * @internal
 */
export function wrapAsyncError(handler: express.ErrorRequestHandler): express.ErrorRequestHandler {
	// Arrays of handlers (e.g. `finalHandler` with `notFoundHandler`) can mix request and error handlers,
	// so each of them is wrapped according to its arity.
	if (Array.isArray(handler)) {
		return handler.map(wrapAsync) as unknown as express.ErrorRequestHandler
	}

	if (typeof handler !== 'function' || isWrapped(handler)) {
		return handler
	}

	const wrapper: express.ErrorRequestHandler = (error, req, res, next) => {
		return forwardRejection(handler(error, req, res, next), next)
	}

	return markWrapped(wrapper, handler)
}

/**
 * Forwards the rejection of a returned promise to `next`.
 *
 * Only native promises are caught (returned by async functions, even transpiled ones),
 * not every thenable, to avoid triggering lazy thenables like query builders
 * that are returned without being meant to be executed.
 *
 * Other values are not returned to express, as express 5 calls `then` on returned thenables.
 * @internal
 */
export function forwardRejection(result: unknown, next: express.NextFunction): Promise<unknown> | undefined {
	return result instanceof Promise ? result.catch(nextOnRejection(next)) : undefined
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
