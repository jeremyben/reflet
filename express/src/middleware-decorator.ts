import { ClassOrMethodDecorator, ClassType, Handler } from './interfaces'
import { defineMetadata, getOwnMetadata } from './metadata-map'

const METAKEY_USE = Symbol('use')

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
export function Use<Req extends {}>(...middlewares: Handler<Req>[]): Use.Decorator {
	return (target, key, descriptor) => {
		// Method middleware
		if (key) {
			const existingMiddlewares = getOwnMetadata(METAKEY_USE, target, key) || []
			// prepend
			defineMetadata(METAKEY_USE, middlewares.concat(existingMiddlewares), target, key)
		}
		// Class middleware
		else {
			const existingMiddlewares = getOwnMetadata(METAKEY_USE, (target as Function).prototype) || []
			// prepend
			defineMetadata(METAKEY_USE, middlewares.concat(existingMiddlewares), (target as Function).prototype)
		}
	}
}

export namespace Use {
	/**
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Decorator = ClassOrMethodDecorator & { __expressUse?: never }
}

/**
 * @internal
 */
export function extractMiddlewares(target: ClassType | Function, key?: string | symbol): Handler[] {
	// Method middlewares
	if (key) return getOwnMetadata(METAKEY_USE, target.prototype, key) || []
	// Class middlewares
	return getOwnMetadata(METAKEY_USE, target.prototype) || []
}
