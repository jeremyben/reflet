import * as express from 'express'
import { ClassType, Controllers, Decorator, ObjectInstance } from './interfaces'

const META = Symbol('router')

/**
 * @internal
 */
type RouterMeta = {
	readonly path: string | RegExp | typeof DYNAMIC_PATH
	readonly options?: express.RouterOptions
	children?: object[]
}

/**
 * Attaches an express Router to a class.
 *
 * The routes will be attached to the router at its root `path`.
 *
 * @param path - root path of the router.
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
 *   getOne(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 *
 * @public
 */
export function Router(path: string | RegExp, options?: express.RouterOptions): Decorator.Router {
	return (target) => {
		const routerMeta: RouterMeta = { path, options }
		Reflect.defineMetadata(META, routerMeta, target)
	}
}

export namespace Router {
	/**
	 * Attaches children controllers to a parent router, to have nested routers.
	 * To be used in the **constructor** of a `@Router` decorated class.
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
	 * @deprecated use `register(this, children)`
	 * @public
	 */
	/* istanbul ignore next - deprecated and replaced by same logic */
	export function register(router: ObjectInstance, children: Controllers) {
		const routerMeta = extractRouterMeta(router.constructor as ClassType)

		if (!routerMeta) {
			throw Error(`"${router.constructor.name}" must be decorated with @Router.`)
		}

		defineChildRouters(router.constructor as ClassType, routerMeta, children)
	}

	/**
	 * Attaches an express Router to a class, without defining a root path.
	 * The root path must be defined at registration.
	 *
	 * Useful for dynamic nested routers.
	 *
	 * @example
	 * ```ts
	 * ＠Router.Dynamic()
	 * class Items {
	 *   ＠Get()
	 *   list(req: Request, res: Response, next: NextFunction) {}
	 * }
	 *
	 * ＠Router('/foo')
	 * class Foo {
	 *   constructor() {
	 *     register(this, [{ path: '/items', router: Items }])
	 *   }
	 * }
	 *
	 * ＠Router('/bar')
	 * class Bar {
	 *   constructor() {
	 *     register(this, [{ path: '/elements', router: Items }])
	 *   }
	 * }
	 * ```
	 * ------
	 * @public
	 */
	export function Dynamic(options?: express.RouterOptions): Decorator.Router {
		return (target) => {
			const routerMeta: RouterMeta = { path: DYNAMIC_PATH, options }
			Reflect.defineMetadata(META, routerMeta, target)
		}
	}
}

/**
 * Token to use in place of `Router` path parameter, signaling that the path is defined at registration.
 * @internal
 */
export const DYNAMIC_PATH = Symbol('dynamic-path')

/**
 * Attaches children controllers to a parent router metadata, before registering the parent.
 * @internal
 */
export function defineChildRouters(parentClass: ClassType, routerMeta: RouterMeta, children: Controllers) {
	routerMeta.children = routerMeta.children ? routerMeta.children.concat(children) : children
	Reflect.defineMetadata(META, routerMeta, parentClass)
}

/**
 * @internal
 */
export function extractRouterMeta(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(META, target)
}
