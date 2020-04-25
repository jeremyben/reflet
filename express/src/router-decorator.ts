import Meta from './metadata-keys'
import { RouterOptions } from 'express'
import { ClassType, Decorator, ObjectNotFunction } from './interfaces'

/**
 * @internal
 */
type RouterMeta = {
	root: string | RegExp
	options?: RouterOptions
	children?: object[]
}

/**
 * Creates and attaches an express Router object to a controller class.
 * The routes in the controller class to which the decorator is applied will be attached to the newly created router at its `root` path.
 * @param root - root path of the router.
 * @param options - specifies router behavior.
 *
 * @see https://expressjs.com/en/4x/api.html#router
 * @example
 * ```ts
 * ＠Router('/things')
 * class Foo {
 *   ＠Get()
 *   list(req: Request, res: Response, next: NextFunction) {}
 *
 *   ＠Get('/:id')
 *   get(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 *
 * @public
 */
export function Router(root: string | RegExp, options?: RouterOptions): Decorator.Router {
	return (target) => {
		const routerMeta: RouterMeta = { root, options }
		Reflect.defineMetadata(Meta.Router, routerMeta, target)
	}
}

export namespace Router {
	/**
	 * Attaches children controllers to a parent router, to have nested routers.
	 *
	 * To be used in the **constructor** of a `@Router` decorated class.
	 *
	 * @param router - should simply be `this`.
	 * @param children - classes or instances with decorated routes.
	 *
	 * @example
	 * ```ts
	 * ＠Router('/foo', { mergeParams: true })
	 * class Foo {
	 *   constructor() {
	 *     Router.register(this, [Bar, Baz])
	 *   }
	 * }
	 * ```
	 * ------
	 * @public
	 */
	export function register<T extends object>(
		router: ObjectNotFunction,
		children: ClassType[] | Exclude<T, ClassType>[]
	) {
		const routerMeta = extractRouter(router.constructor as ClassType)

		if (!routerMeta) {
			throw Error(`"${router.constructor.name}" must be decorated with @Router.`)
		}

		routerMeta.children = children
		Reflect.defineMetadata(Meta.Router, routerMeta, router.constructor)
	}
}

/**
 * @internal
 */
export function extractRouter(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(Meta.Router, target)
}
