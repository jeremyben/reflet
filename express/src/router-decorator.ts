import * as express from 'express'
import { ClassType, Controllers, Decorator, ObjectInstance } from './interfaces'

const MetaKey = Symbol('router')

/**
 * @internal
 */
type RouterMeta = {
	root: string | RegExp
	options?: express.RouterOptions
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
export function Router(root: string | RegExp, options?: express.RouterOptions): Decorator.Router {
	return (target) => {
		const routerMeta: RouterMeta = { root, options }
		Reflect.defineMetadata(MetaKey, routerMeta, target)
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
	export function register(router: ObjectInstance, children: Controllers) {
		const routerMeta = extractRouter(router.constructor as ClassType)

		if (!routerMeta) {
			throw Error(`"${router.constructor.name}" must be decorated with @Router.`)
		}

		routerMeta.children = routerMeta.children ? routerMeta.children.concat(children) : children
		Reflect.defineMetadata(MetaKey, routerMeta, router.constructor)
	}
}

/**
 * @internal
 */
export function defineChildRouters(parentClass: ClassType, routerMeta: RouterMeta, children: Controllers) {
	routerMeta.children = routerMeta.children ? routerMeta.children.concat(children) : children
	Reflect.defineMetadata(MetaKey, routerMeta, parentClass)
}

/**
 * @internal
 */
export function extractRouter(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(MetaKey, target)
}
