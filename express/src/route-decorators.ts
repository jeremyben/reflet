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
 * @remarks
 * Should be used as a tool to create a custom route decorator, but you can apply it directly.
 *
 * ------
 * @example
 * ```ts
 * const Options = (path: string | RegExp) => Method('options', path)
 *
 * class Foo {
 *   ＠Options('/things')
 *   options(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @public
 */
export function Method(method: RoutingMethod, path: string | RegExp): Decorator.Route {
	return (target, key, descriptor) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: RouteMeta[] = Reflect.getOwnMetadata(MetaKey, target) || []
		routes.push({ path, method, key })
		Reflect.defineMetadata(MetaKey, routes, target)
	}
}

/**
 * Retrieve routes of a class.
 * @internal
 */
export function extractRoutes(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(MetaKey, target.prototype) || []
}
