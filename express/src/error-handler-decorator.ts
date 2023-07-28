import * as express from 'express'
import { ClassOrMethodDecorator, ClassType } from './interfaces'
import { getMetadata, defineMetadata, getOwnMetadata } from './metadata-map'

const METAKEY_CATCH = Symbol('catch')

/**
 * Attaches an error handler on a single route when applied to a method, or on multipe routes when applied to a router class.
 * @see http://expressjs.com/en/guide/error-handling.html
 *
 * @remarks
 * You can apply as many `Catch` decorators as you want.
 * Error handlers are applied on the routes in the order they are written.
 *
 * @example
 * ```ts
 * ＠Catch(someDefaultErrorHandler)
 * class Foo {
 *   ＠Catch((err, req, res, next) => {
 *     res.status(400).send(err.message)
 *   })
 *   ＠Get('/some')
 *   get(req: Request, res: Response, next: NextFunction) {
 *     throw Error('Nope')
 *   }
 * }
 * ```
 * ------
 * @public
 */
export function Catch<T = any>(
	errorHandler: (err: T, req: express.Request, res: express.Response, next: express.NextFunction) => any
): Catch.Decorator {
	return (target, key, descriptor) => {
		// Method
		if (key) {
			const handlers: express.ErrorRequestHandler[] = getMetadata(METAKEY_CATCH, target, key) || []
			handlers.unshift(errorHandler)
			defineMetadata(METAKEY_CATCH, handlers, target, key)
		}
		// Class
		else {
			const handlers: express.ErrorRequestHandler[] =
				getMetadata(METAKEY_CATCH, (target as Function).prototype) || []
			handlers.unshift(errorHandler)
			defineMetadata(METAKEY_CATCH, handlers, (target as Function).prototype)
		}
	}
}

export namespace Catch {
	/**
	 * Used for `@Catch` decorator.
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Decorator = ClassOrMethodDecorator & { __expressCatch?: never }
}

/**
 * @internal
 */
export function extractErrorHandlers(
	target: ClassType | Function,
	key?: string | symbol
): express.ErrorRequestHandler[] {
	// Method
	if (key) return getOwnMetadata(METAKEY_CATCH, target.prototype, key) || []
	// Class
	return getOwnMetadata(METAKEY_CATCH, target.prototype) || []
}
