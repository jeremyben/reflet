import Meta from './metadata-keys'
import { ClassType, RoutingMethod, RouteDecorator } from './interfaces'

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
 *
 * @remarks
 * Example :
 * ```ts
 * class Foo {
 *   ＠Get('/things/:id')
 *   get(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.get.method
 *
 * @decorator method
 * @public
 */
export const Get = (path: string | RegExp = '') => Method('get', path)

/**
 * Routes HTTP `POST` requests.
 * @param path - path for which the decorated class method is invoked.
 *
 * @remarks
 * Example :
 * ```ts
 * class Foo {
 *   ＠Post('/things')
 *   create(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.post.method
 *
 * @decorator method
 * @public
 */
export const Post = (path: string | RegExp = '') => Method('post', path)

/**
 * Routes HTTP `PUT` requests.
 * @param path - path for which the decorated class method is invoked.
 *
 * @remarks
 * Example :
 * ```ts
 * class Foo {
 *   ＠Put('/things/:id')
 *   replace(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.put.method
 *
 * @decorator method
 * @public
 */
export const Put = (path: string | RegExp = '') => Method('put', path)

/**
 * Routes HTTP `PATCH` requests.
 * @param path - path for which the decorated class method is invoked.
 *
 * @remarks
 * Example :
 * ```ts
 * class Foo {
 *   ＠Patch('/things/:id')
 *   update(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 *
 * @decorator method
 * @public
 */
export const Patch = (path: string | RegExp = '') => Method('patch', path)

/**
 * Routes HTTP `DELETE` requests.
 * @param path - path for which the decorated class method is invoked.
 *
 * @remarks
 * Example :
 * ```ts
 * class Foo {
 *   ＠Delete('/things/:id')
 *   remove(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.delete.method
 *
 * @decorator method
 * @public
 */
export const Delete = (path: string | RegExp = '') => Method('delete', path)

/**
 * Routes an HTTP request.
 * @param method - HTTP method of the request, in lowercase.
 * @param path - path for which the decorated class method is invoked.
 *
 * @remarks
 * Should be used as a tool to create a custom route decorator :
 * ```ts
 * const Options = (path: string | RegExp) => Method('options', path)
 * // then, on a class method:
 * class Foo {
 *   ＠Options('/things')
 *   options(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * But you can apply it directly :
 * ```ts
 * class Foo {
 *   ＠Method('options', '/things')
 *   options(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 *
 * @decorator method
 * @public
 */
export function Method(method: RoutingMethod, path: string | RegExp): RouteDecorator {
	return (target, key, descriptor) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: RouteMeta[] = Reflect.getOwnMetadata(Meta.Route, target) || []
		routes.push({ path, method, key })
		Reflect.defineMetadata(Meta.Route, routes, target)
	}
}

/**
 * Retrieve routes of a class.
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractRoutes(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(Meta.Route, target.prototype) || []
}
