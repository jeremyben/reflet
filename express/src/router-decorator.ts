import * as express from 'express'
import { ClassType, RegistrationArray, Decorator, IsAny } from './interfaces'

const META = Symbol('router')

/**
 * @internal
 */
type RouterMeta = {
	path: string | RegExp | typeof DYNAMIC_PATH | null
	options?: express.RouterOptions
	children?: RegistrationArray | ((...deps: any[]) => RegistrationArray)
	childrenDeps?: any[]
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
		const existingRouterMeta = extractRouterMeta(target)

		if (existingRouterMeta) {
			existingRouterMeta.path = path
			existingRouterMeta.options = options
		} else {
			const newRouterMeta: RouterMeta = { path, options }
			defineRouterMeta(newRouterMeta, target)
		}
	}
}

export namespace Router {
	/**
	 * Attaches children routers to a parent router, to have nested routers.
	 *
	 * @param register - function that should return an array of routers.
	 *
	 * @example
	 * ```ts
	 * ＠Router('/foo')
	 * ＠Router.Children(() => [NestedRouter])
	 * class ParentRouter {}
	 *
	 * ＠Router('/bar')
	 * class NestedRouter {}
	 * ```
	 * ------
	 * @public
	 */
	export function Children<T extends ClassType = any>(
		// tslint:disable-next-line: no-shadowed-variable
		register: (...deps: IsAny<T> extends true ? unknown[] : ConstructorParameters<T>) => RegistrationArray
	): Decorator.RouterChildren {
		return (target) => {
			const existingRouterMeta = extractRouterMeta(target)

			if (existingRouterMeta) {
				existingRouterMeta.children = register as (...deps: any[]) => RegistrationArray
				existingRouterMeta.childrenDeps = []
			} else {
				const newRouterMeta: RouterMeta = {
					path: null,
					children: register as (...deps: any[]) => RegistrationArray,
					childrenDeps: [],
				}

				defineRouterMeta(newRouterMeta, target)
			}

			// No need to intercept constructor if no dependency.
			if (!target.length || !register.length) {
				return
			}

			// Intercept the constructor to retrieve dependencies and pass them down to children.
			// https://stackoverflow.com/questions/34411546/how-to-properly-wrap-constructors-with-decorators-in-typescript
			return new Proxy(target, {
				construct(target_, args, newTarget) {
					const routerMeta = extractRouterMeta(target)!
					routerMeta.childrenDeps = args

					return new (target as any)(...args)
				},
			})
		}
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
			defineRouterMeta(routerMeta, target)
		}
	}
}

/**
 * Token to use in place of `Router` path parameter, signaling that the path is defined at registration.
 * @internal
 */
export const DYNAMIC_PATH = Symbol('dynamic-path')

/**
 * Attaches children routers to a parent router metadata, before registering the parent.
 * @internal
 */
export function defineChildRouters(parentClass: ClassType, routerMeta: RouterMeta, children: RegistrationArray): void {
	if (typeof routerMeta.children === 'function') {
		throw Error('Nested routers are already defined through @Router.Children.')
	}

	routerMeta.children = routerMeta.children ? routerMeta.children.concat(children) : children

	defineRouterMeta(routerMeta, parentClass)
}

/**
 * @internal
 */
export function extractRouterMeta(target: ClassType | Function): RouterMeta | undefined {
	return Reflect.getOwnMetadata(META, target.prototype)
}

/**
 * @internal
 */
function defineRouterMeta(routerMeta: RouterMeta, target: ClassType | Function): void {
	// Attached to the prototype, because the constructor might be replaced with a proxy.
	Reflect.defineMetadata(META, routerMeta, target.prototype)
}
