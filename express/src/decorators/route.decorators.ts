import Meta from './metadata-keys'
import { ClassType, RoutingMethod } from '../interfaces'

type Route = {
	path: string | RegExp
	method: RoutingMethod
	key: string | symbol
}

/**
 * Routes HTTP `GET` requests.
 * @see http://expressjs.com/en/4x/api.html#app.get.method
 * @public
 */
export const Get = (path: string | RegExp = '') => Method('get', path)

/**
 * Routes HTTP `POST` requests.
 * @see http://expressjs.com/en/4x/api.html#app.post.method
 * @public
 */
export const Post = (path: string | RegExp = '') => Method('post', path)

/**
 * Routes HTTP `PUT` requests.
 * @see http://expressjs.com/en/4x/api.html#app.put.method
 * @public
 */
export const Put = (path: string | RegExp = '') => Method('put', path)

/**
 * Routes HTTP `PATCH` requests.
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export const Patch = (path: string | RegExp = '') => Method('patch', path)

/**
 * Routes HTTP `DELETE` requests.
 * @see http://expressjs.com/en/4x/api.html#app.delete.method
 * @public
 */
export const Delete = (path: string | RegExp = '') => Method('delete', path)

/**
 * Routes an HTTP request.
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Method(method: RoutingMethod, path: string | RegExp): MethodDecorator {
	return (target, key, descriptor: TypedPropertyDescriptor<any>) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: Route[] = Reflect.getOwnMetadata(Meta.Route, target) || []
		routes.push({ path, method, key })
		Reflect.defineMetadata(Meta.Route, routes, target)
	}
}

/**
 * Retrieve routes of a class.
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractRoutes(target: ClassType): Route[] {
	return Reflect.getOwnMetadata(Meta.Route, target.prototype) || []
}
