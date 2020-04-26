import { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import { ClassType, Decorator } from './interfaces'

const MetaKey = Symbol('catch')

/**
 * Attaches an error handler on a single route when applied to a method, or on multipe routes when applied to a controller class.
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
	errorHandler: (err: T, req: Request, res: Response, next: NextFunction) => any
): Decorator.Catch {
	return (target, key, descriptor) => {
		// Method
		if (key) {
			const handlers: ErrorRequestHandler[] = Reflect.getOwnMetadata(MetaKey, target, key) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(MetaKey, handlers, target, key)
		}
		// Class
		else {
			const handlers: ErrorRequestHandler[] = Reflect.getOwnMetadata(MetaKey, target) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(MetaKey, handlers, target)
		}
	}
}

/**
 * @internal
 */
export function extractErrorHandlers(target: ClassType, key?: string | symbol): ErrorRequestHandler[] {
	// Method
	if (key) return Reflect.getOwnMetadata(MetaKey, target.prototype, key) || []
	// Class
	return Reflect.getOwnMetadata(MetaKey, target) || []
}
