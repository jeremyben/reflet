import { Decorator, ClassType, Handler } from './interfaces'

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
			const existingMiddlewares = Reflect.getOwnMetadata(META, target, key) || []
			// prepend
			Reflect.defineMetadata(META, middlewares.concat(existingMiddlewares), target, key)
		}
		// Class middleware
		else {
			const existingMiddlewares = Reflect.getOwnMetadata(META, (target as Function).prototype) || []
			// prepend
			Reflect.defineMetadata(META, middlewares.concat(existingMiddlewares), (target as Function).prototype)
		}
	}
}

/**
 * @internal
 */
export function extractMiddlewares(target: ClassType | Function, key?: string | symbol): Handler[] {
	// Method middlewares
	if (key) return Reflect.getOwnMetadata(META, target.prototype, key) || []
	// Class middlewares
	return Reflect.getOwnMetadata(META, target.prototype) || []
}
