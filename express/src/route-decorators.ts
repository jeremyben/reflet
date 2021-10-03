import { ClassType, Decorator } from './interfaces'

const META = Symbol('route')

/**
 * @internal
 */
type RouteMeta = {
	readonly path: string | RegExp
	readonly method: Route.Method
	readonly key: string | symbol
}

/**
 * Routes HTTP `GET` requests.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.get.method
 * @example
 * ```ts
 * class Foo {
 *   ＠Get('/things/:id')
 *   get(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export const Get = (path: string | RegExp = '') => Route('get', path)

/**
 * Routes HTTP `POST` requests.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.post.method
 * @example
 * ```ts
 * class Foo {
 *   ＠Post('/things')
 *   create(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export const Post = (path: string | RegExp = '') => Route('post', path)

/**
 * Routes HTTP `PUT` requests.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.put.method
 * @example
 * ```ts
 * class Foo {
 *   ＠Put('/things/:id')
 *   replace(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export const Put = (path: string | RegExp = '') => Route('put', path)

/**
 * Routes HTTP `PATCH` requests.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 * @example
 * ```ts
 * class Foo {
 *   ＠Patch('/things/:id')
 *   update(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export const Patch = (path: string | RegExp = '') => Route('patch', path)

/**
 * Routes HTTP `DELETE` requests.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.delete.method
 * @example
 * ```ts
 * class Foo {
 *   ＠Delete('/things/:id')
 *   remove(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export const Delete = (path: string | RegExp = '') => Route('delete', path)

/**
 * Routes an HTTP request.
 * @param method - HTTP method of the request, in lowercase.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Route(method: Route.Method | Route.Method[], path: string | RegExp): Decorator.Route {
	return (target, key, descriptor) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: RouteMeta[] = Reflect.getOwnMetadata(META, target) || []

		if (Array.isArray(method)) {
			for (const methodd of method) {
				routes.push({ path, method: methodd, key })
			}
		} else {
			routes.push({ path, method, key })
		}

		Reflect.defineMetadata(META, routes, target)
	}
}

/* istanbul ignore next */
// tslint:disable: no-shadowed-variable
export namespace Route {
	export const Get = (path: string | RegExp = '') => Route('get', path)
	export const Post = (path: string | RegExp = '') => Route('post', path)
	export const Put = (path: string | RegExp = '') => Route('put', path)
	export const Patch = (path: string | RegExp = '') => Route('patch', path)
	export const Delete = (path: string | RegExp = '') => Route('delete', path)
	export const Head = (path: string | RegExp = '') => Route('head', path)
	export const Options = (path: string | RegExp = '') => Route('options', path)
	export const Trace = (path: string | RegExp = '') => Route('trace', path)
	export const Notify = (path: string | RegExp = '') => Route('notify', path)
	export const Subscribe = (path: string | RegExp = '') => Route('subscribe', path)
	export const Unsubscribe = (path: string | RegExp = '') => Route('unsubscribe', path)
	export const Purge = (path: string | RegExp = '') => Route('purge', path)
	export const Checkout = (path: string | RegExp = '') => Route('checkout', path)
	export const Move = (path: string | RegExp = '') => Route('move', path)
	export const Copy = (path: string | RegExp = '') => Route('copy', path)
	export const Merge = (path: string | RegExp = '') => Route('merge', path)
	export const Report = (path: string | RegExp = '') => Route('report', path)
	export const MSearch = (path: string | RegExp = '') => Route('m-search', path)
	export const Mkactivity = (path: string | RegExp = '') => Route('mkactivity', path)
	export const Mkcol = (path: string | RegExp = '') => Route('mkcol', path)
	export const Search = (path: string | RegExp = '') => Route('search', path)
	export const Lock = (path: string | RegExp = '') => Route('lock', path)
	export const Unlock = (path: string | RegExp = '') => Route('unlock', path)
	export const All = (path: string | RegExp = '') => Route('all', path)

	/**
	 * @see http://expressjs.com/en/4x/api.html#routing-methods
	 * @public
	 */
	export type Method =
		| 'checkout'
		| 'copy'
		| 'delete'
		| 'get'
		| 'head'
		| 'lock'
		| 'merge'
		| 'mkactivity'
		| 'mkcol'
		| 'move'
		| 'm-search'
		| 'notify'
		| 'options'
		| 'patch'
		| 'post'
		| 'purge'
		| 'put'
		| 'report'
		| 'search'
		| 'subscribe'
		| 'trace'
		| 'unlock'
		| 'unsubscribe'
		| 'all'
}

/**
 * Retrieve routes of a class.
 * @internal
 */
export function extractRoutes(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(META, target.prototype) || []
}

/**
 * @internal
 */
export function hasRoutes(target: ClassType): boolean {
	return Reflect.hasOwnMetadata(META, target.prototype)
}
