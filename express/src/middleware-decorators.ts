import Meta from './metadata-keys'
import { RequestHandler, ErrorRequestHandler } from 'express'
import { ClassType, GenericDecorator } from './interfaces'
import { concatPrependFast } from './utils'

/**
 * Attaches middlewares on a single route when applied to a method, or on multipe routes when applied to a class.
 *
 * @remarks
 * You can specify as much middlewares as you want inside a single `Use` decorator,
 * and apply as many `Use` decorators as you want.
 *
 * ```ts
 * @Use(express.json(), express.urlencoded())
 * class Foo {
 * 		@Use((req, res, next) => {
 * 			req.bar = 1
 * 			next()
 * 		})
 * 		@Use((req, res, next) => {
 * 			req.baz = 2
 * 			next()
 * 		})
 * 		@Get('/me')
 * 		getMe() {}
 * }
 * ```
 *
 * Middlewares are attached on the routes in the order they are written, even though
 * decorator functions in JS are executed in a bottom-up way (due to their _wrapping_ nature).
 *
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @see https://expressjs.com/en/guide/writing-middleware.html
 *
 * @public
 */
export function Use(...middlewares: RequestHandler[]): GenericDecorator {
	return (target, key, descriptor) => {
		// Method middleware
		if (key) {
			concatPrependFast(Reflect.getOwnMetadata(Meta.Use, target, key) || [], middlewares)
			Reflect.defineMetadata(Meta.Use, middlewares, target, key)
		}

		// Class middleware
		else {
			concatPrependFast(Reflect.getOwnMetadata(Meta.Use, target) || [], middlewares)
			Reflect.defineMetadata(Meta.Use, middlewares, target)
		}
	}
}

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
 * @public
 */
export function Catch(errorMiddleware: ErrorRequestHandler): GenericDecorator {
	return (target, methodKey, descriptor) => {
		// Method middleware
		if (methodKey) {
			const handlers: ErrorRequestHandler[] =
				Reflect.getOwnMetadata(Meta.Catch, target, methodKey) || []
			handlers.unshift(errorMiddleware)
			Reflect.defineMetadata(Meta.Catch, handlers, target, methodKey)
		}

		// Class middleware
		else {
			const handlers: ErrorRequestHandler[] = Reflect.getOwnMetadata(Meta.Catch, target) || []
			handlers.unshift(errorMiddleware)
			Reflect.defineMetadata(Meta.Catch, handlers, target)
		}
	}
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractMiddlewares(target: ClassType, key?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (key) return Reflect.getOwnMetadata(Meta.Use, target.prototype, key) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.Use, target) || []
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractCatch(target: ClassType, methodKey?: string | symbol): ErrorRequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.Catch, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.Catch, target) || []
}
