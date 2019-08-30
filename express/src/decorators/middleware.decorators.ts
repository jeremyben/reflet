import Meta from './metadata-keys'
import { RequestHandler } from 'express'
import { ClassType, GenericDecorator } from '../interfaces'
import { concatPrependFast } from '../utils'

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
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractMiddlewares(target: ClassType, key?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (key) return Reflect.getOwnMetadata(Meta.Use, target.prototype, key) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.Use, target) || []
}
