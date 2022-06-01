import * as express from 'express'
import { ClassType, Registration, IsAny, ClassOrMethodDecorator } from './interfaces'

const META = Symbol('router')

/**
 * @internal
 */
type RouterMeta = {
	path: string | RegExp | typeof DYNAMIC_PATH | null
	options?: express.RouterOptions
	scopedMiddlewares?: boolean
	children?: Registration[] | ((...deps: any[]) => Registration[])
	childrenDeps?: any[]
}

/**
 * Token to use in place of `Router` path parameter, signaling that the path is defined at registration.
 * @internal
 */
export const DYNAMIC_PATH = Symbol('dynamic-path')

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
export function Router(path: string | RegExp, options?: express.RouterOptions): Router.Decorator {
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
		register: (...deps: IsAny<T> extends true ? unknown[] : ConstructorParameters<T>) => Registration[]
	): Router.Children.Decorator {
		return (target) => {
			const existingRouterMeta = extractRouterMeta(target)

			if (existingRouterMeta) {
				existingRouterMeta.children = register as (...deps: any[]) => Registration[]
				existingRouterMeta.childrenDeps = []
			} else {
				const newRouterMeta: RouterMeta = {
					path: null,
					children: register as (...deps: any[]) => Registration[],
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
				construct(targett, args, newTarget) {
					const routerMeta = extractRouterMeta(target)!
					routerMeta.childrenDeps = args

					return new (target as any)(...args)
				},
			})
		}
	}

	export namespace Children {
		/**
		 * Equivalent to `ClassDecorator`.
		 * @public
		 */
		export type Decorator = ClassDecorator & { __expressRouterChildren?: never }
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
	 *     register(this, [['/items', Items]])
	 *   }
	 * }
	 *
	 * ＠Router('/bar')
	 * class Bar {
	 *   constructor() {
	 *     register(this, [['/elements', Items]])
	 *   }
	 * }
	 * ```
	 * ------
	 * @public
	 */
	export function Dynamic(options?: express.RouterOptions): Router.Decorator {
		return (target) => {
			const routerMeta: RouterMeta = { path: DYNAMIC_PATH, options }
			defineRouterMeta(routerMeta, target)
		}
	}

	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & { __expressRouter?: never }
}

/**
 * Middlewares applied to the router will be scoped to its own routes, independently of its path.
 *
 * @remarks
 * Express isolates routers by their path, so if two routers share the same path, they will share middlewares.
 * This decorator prevents this by applying middlewares directly to the routes instead of the router.
 *
 * @example
 * ```ts
 * ＠Router('/foo')
 * ＠ScopedMiddlewares
 * ＠Use(authenticate)
 * class FooSecret {
 *   ＠Get()
 *   getSecret(req: Request, res: Response, next: NextFunction) {}
 * }
 *
 * ＠Router('/foo')
 * class FooPublic {
 *   ＠Get()
 *   getPublic(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export function ScopedMiddlewares(): ScopedMiddlewares.Decorator
export function ScopedMiddlewares(...args: Parameters<ScopedMiddlewares.Decorator>): void
export function ScopedMiddlewares(targetMaybe?: Function): ScopedMiddlewares.Decorator | void {
	if (targetMaybe) {
		const existingRouterMeta = extractRouterMeta(targetMaybe)

		if (existingRouterMeta) {
			existingRouterMeta.scopedMiddlewares = true
		} else {
			const newRouterMeta: RouterMeta = {
				path: null,
				scopedMiddlewares: true,
			}

			defineRouterMeta(newRouterMeta, targetMaybe)
		}
	} else {
		return (target) => {
			const existingRouterMeta = extractRouterMeta(target)

			if (existingRouterMeta) {
				existingRouterMeta.scopedMiddlewares = true
			} else {
				const newRouterMeta: RouterMeta = {
					path: null,
					scopedMiddlewares: true,
				}

				defineRouterMeta(newRouterMeta, target)
			}
		}
	}
}

export namespace ScopedMiddlewares {
	/**
	 * Remove `ScopedMiddlewares` behavior on a specific router, when applied globally to the app.
	 */
	export function Dont(): ScopedMiddlewares.Dont.Decorator
	export function Dont(...args: Parameters<ScopedMiddlewares.Dont.Decorator>): void
	export function Dont(targetMaybe?: any, keyMaybe?: any): ScopedMiddlewares.Dont.Decorator | void {
		if (targetMaybe) {
			const existingRouterMeta = extractRouterMeta(targetMaybe)

			if (existingRouterMeta) {
				existingRouterMeta.scopedMiddlewares = false
			} else {
				const newRouterMeta: RouterMeta = {
					path: null,
					scopedMiddlewares: false,
				}

				defineRouterMeta(newRouterMeta, targetMaybe)
			}
		} else {
			return (target) => {
				const existingRouterMeta = extractRouterMeta(target)

				if (existingRouterMeta) {
					existingRouterMeta.scopedMiddlewares = false
				} else {
					const newRouterMeta: RouterMeta = {
						path: null,
						scopedMiddlewares: false,
					}

					defineRouterMeta(newRouterMeta, target)
				}
			}
		}
	}

	export namespace Dont {
		/**
		 * Equivalent to `ClassDecorator`.
		 * @public
		 */
		export type Decorator = ClassDecorator & { __expressScopedMiddlewaresDont?: never }
	}

	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & { __expressScopedMiddlewares?: never }
}

/**
 * @internal
 */
export function extractRouterMeta(target: ClassType | Function, appClass?: ClassType): RouterMeta | undefined {
	const appMeta: Pick<RouterMeta, 'scopedMiddlewares'> | undefined = appClass
		? Reflect.getOwnMetadata(META, (appClass as Function).prototype)
		: undefined

	const routerMeta: RouterMeta | undefined = Reflect.getOwnMetadata(META, target.prototype)

	if (!appMeta || !routerMeta) {
		return routerMeta
	}

	if (routerMeta.scopedMiddlewares == null && appMeta.scopedMiddlewares != null) {
		routerMeta.scopedMiddlewares = appMeta.scopedMiddlewares
	}

	return routerMeta
}

/**
 * @internal
 */
function defineRouterMeta(routerMeta: RouterMeta, target: ClassType | Function): void {
	// Attached to the prototype, because the constructor might be replaced with a proxy.
	Reflect.defineMetadata(META, routerMeta, target.prototype)
}
