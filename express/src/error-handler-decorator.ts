import Meta from './metadata-keys'
import { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import { ClassType, ClassOrMethodDecorator } from './interfaces'

/**
 * Attaches an error handler on a single route when applied to a method, or on multipe routes when applied to a class.
 *
 * @remarks
 * You can apply as many `Catch` decorators as you want.
 * ```ts
 * @Catch(someDefaultErrorHandler)
 * class Foo {
 * 		@Catch((err, req, res, next) => {
 * 			res.status(err.status).send(err.message)
 * 		})
 * 		@Get('/me')
 * 		getMe() {
 *         const err = Error('Nope')
 *         err.status = 400
 *         throw err
 *     }
 * }
 * ```
 * Error handlers are attached on the routes in the order they are written, even though
 * decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).
 *
 * @see http://expressjs.com/en/guide/error-handling.html
 *
 * @decorator class, method
 * @public
 */
export function Catch<T = any>(
	errorHandler: (err: T, req: Request, res: Response, next: NextFunction) => any
): ClassOrMethodDecorator {
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
