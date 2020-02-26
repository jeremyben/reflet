import Meta from './metadata-keys'
import { RequestHandler } from 'express'
import { concatPrependFast } from './array-manipulation'
import { ClassType, Decorator } from './interfaces'

/**
 * Applies middlewares on a single route when applied to a method, or on multipe routes when applied to a class.
 * @see https://expressjs.com/en/4x/api.html#app.use
 *
 * @remarks
 * You can specify as much middlewares as you want inside a single `Use` decorator,
 * and apply as many `Use` decorators as you want.
 * Middlewares are applied on the routes in the order they are written.
 *
 * ------
 * @example
 * ```ts
 * ＠Use(express.json(), express.urlencoded())
 * class Foo {
 *   ＠Use((req, res, next) => {
 *     req.bar = 1
 *     next()
 *   })
 *   ＠Post('/some')
 *   create(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export function Use(...middlewares: RequestHandler[]): Decorator.Use {
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
