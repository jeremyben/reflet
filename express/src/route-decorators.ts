import { ClassType, RoutingMethod, Decorator } from './interfaces'

const MetaKey = Symbol('route')

/**
 * @internal
 */
type RouteMeta = {
	path: string | RegExp
	method: RoutingMethod
	key: string | symbol
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
export const Get = (path: string | RegExp = '') => Method('get', path)

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
export const Post = (path: string | RegExp = '') => Method('post', path)

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
export const Put = (path: string | RegExp = '') => Method('put', path)

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
export const Patch = (path: string | RegExp = '') => Method('patch', path)

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
export const Delete = (path: string | RegExp = '') => Method('delete', path)

/**
 * Routes an HTTP request.
 * @param method - HTTP method of the request, in lowercase.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Method<T extends RoutingMethod>(method: T, path: string | RegExp): Decorator.Route<T> {
	return (target, key, descriptor) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: RouteMeta[] = Reflect.getOwnMetadata(MetaKey, target) || []
		routes.push({ path, method, key })
		Reflect.defineMetadata(MetaKey, routes, target)
	}
}

// tslint:disable: no-shadowed-variable
export namespace Method {
	export const Get = (path: string | RegExp = '') => Method('get', path)
	export const Post = (path: string | RegExp = '') => Method('post', path)
	export const Put = (path: string | RegExp = '') => Method('put', path)
	export const Patch = (path: string | RegExp = '') => Method('patch', path)
	export const Delete = (path: string | RegExp = '') => Method('delete', path)
	export const Head = (path: string | RegExp = '') => Method('head', path)
	export const Options = (path: string | RegExp = '') => Method('options', path)
	export const Trace = (path: string | RegExp = '') => Method('trace', path)
	export const Notify = (path: string | RegExp = '') => Method('notify', path)
	export const Subscribe = (path: string | RegExp = '') => Method('subscribe', path)
	export const Unsubscribe = (path: string | RegExp = '') => Method('unsubscribe', path)
	export const Purge = (path: string | RegExp = '') => Method('purge', path)
	export const Checkout = (path: string | RegExp = '') => Method('checkout', path)
	export const Move = (path: string | RegExp = '') => Method('move', path)
	export const Copy = (path: string | RegExp = '') => Method('copy', path)
	export const Merge = (path: string | RegExp = '') => Method('merge', path)
	export const Report = (path: string | RegExp = '') => Method('report', path)
	export const MSearch = (path: string | RegExp = '') => Method('m-search', path)
	export const Mkactivity = (path: string | RegExp = '') => Method('mkactivity', path)
	export const Mkcol = (path: string | RegExp = '') => Method('mkcol', path)
	export const Search = (path: string | RegExp = '') => Method('search', path)
	export const Lock = (path: string | RegExp = '') => Method('lock', path)
	export const Unlock = (path: string | RegExp = '') => Method('unlock', path)
	export const All = (path: string | RegExp = '') => Method('all', path)
}

/**
 * Retrieve routes of a class.
 * @internal
 */
export function extractRoutes(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(MetaKey, target.prototype) || []
}
