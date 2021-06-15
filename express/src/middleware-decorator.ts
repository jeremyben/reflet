import { concatPrependFast } from './array-manipulation'
import { ClassType, Decorator, Handler } from './interfaces'

const META = Symbol('use')

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
 *   ＠Use<{ bar?: number }>((req, res, next) => {
 *     req.bar = 1
 *     next()
 *   })
 *   ＠Post('/some')
 *   create(req: Request & { bar: number }, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export function Use<Req extends {}>(...middlewares: Handler<Req>[]): Decorator.Use {
	return (target, key, descriptor) => {
		// Method middleware
		if (key) {
			concatPrependFast(Reflect.getOwnMetadata(META, target, key) || [], middlewares)
			Reflect.defineMetadata(META, middlewares, target, key)
		}
		// Class middleware
		else {
			concatPrependFast(Reflect.getOwnMetadata(META, target) || [], middlewares)
			Reflect.defineMetadata(META, middlewares, target)
		}
	}
}

/**
 * @internal
 */
export function extractMiddlewares(target: ClassType, key?: string | symbol): Handler[] {
	// Method middlewares
	if (key) return Reflect.getOwnMetadata(META, target.prototype, key) || []
	// Class middlewares
	return Reflect.getOwnMetadata(META, target) || []
}
