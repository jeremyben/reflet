import Meta from './metadata-keys'
import { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import { ClassType, ErrorHandlerDecorator } from './interfaces'

/**
 * Attaches an error handler on a single route when applied to a method, or on multipe routes when applied to a controller class.
 *
 * @remarks
 * You can apply as many `Catch` decorators as you want.
 *
 * ------
 * Example :
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
 * Error handlers are applied on the routes in the order they are written.
 *
 * @see http://expressjs.com/en/guide/error-handling.html
 *
 * @decorator class, method
 * @public
 */
export function Catch<T = any>(
	errorHandler: (err: T, req: Request, res: Response, next: NextFunction) => any
): ErrorHandlerDecorator {
	return (target, key, descriptor) => {
		// Method
		if (key) {
			const handlers: ErrorRequestHandler[] = Reflect.getOwnMetadata(Meta.Catch, target, key) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(Meta.Catch, handlers, target, key)
		}
		// Class
		else {
			const handlers: ErrorRequestHandler[] = Reflect.getOwnMetadata(Meta.Catch, target) || []
			handlers.unshift(errorHandler)
			Reflect.defineMetadata(Meta.Catch, handlers, target)
		}
	}
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractErrorHandlers(target: ClassType, key?: string | symbol): ErrorRequestHandler[] {
	// Method
	if (key) return Reflect.getOwnMetadata(Meta.Catch, target.prototype, key) || []
	// Class
	return Reflect.getOwnMetadata(Meta.Catch, target) || []
}
