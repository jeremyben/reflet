import * as express from 'express'
import { ClassType, Decorator } from './interfaces'

const META = Symbol('catch')

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
): Decorator.Catch {
	return (target, key, descriptor) => {
		// Method
		if (key) {
			const handlers: express.ErrorRequestHandler[] = Reflect.getMetadata(META, target, key) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(META, handlers, target, key)
		}
		// Class
		else {
			const handlers: express.ErrorRequestHandler[] =
				Reflect.getMetadata(META, (target as Function).prototype) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(META, handlers, (target as Function).prototype)
		}
	}
}

/**
 * @internal
 */
export function extractErrorHandlers(
	target: ClassType | Function,
	key?: string | symbol
): express.ErrorRequestHandler[] {
	// Method
	if (key) return Reflect.getOwnMetadata(META, target.prototype, key) || []
	// Class
	return Reflect.getOwnMetadata(META, target.prototype) || []
}
