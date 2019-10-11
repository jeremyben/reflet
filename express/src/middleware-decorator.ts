import Meta from './metadata-keys'
import { RequestHandler } from 'express'
import { ClassType, MiddlewareDecorator } from './interfaces'
import { concatPrependFast } from './array-manipulation'

/**
 * Applies middlewares on a single route when applied to a method, or on multipe routes when applied to a controller class.
 *
 * @remarks
 * You can specify as much middlewares as you want inside a single `Use` decorator,
 * and apply as many `Use` decorators as you want.
 *
 * ------
 * Example :
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
 * Middlewares are applied on the routes in the order they are written.
 *
 * @see https://expressjs.com/en/4x/api.html#app.use
 * @see https://expressjs.com/en/guide/writing-middleware.html
 *
 * @decorator class, method
 * @public
 */
export function Use(...middlewares: RequestHandler[]): MiddlewareDecorator {
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
