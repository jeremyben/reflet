import Meta from './metadata-keys'
import { ClassType, RoutingMethod } from '../interfaces'

type RouteMeta = {
	path: string | RegExp
	verb: RoutingMethod
	methodKey: string | symbol
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.get.method
 * @public
 */
export function Get(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'get')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.post.method
 * @public
 */
export function Post(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'post')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.put.method
 * @public
 */
export function Put(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'put')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Patch(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'patch')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.delete.method
 * @public
 */
export function Delete(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'delete')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Head(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'head')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Options(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'options')
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.all
 * @public
 */
export function All(path: string | RegExp = '') {
	return createRoutingDecorator(path, 'all')
}

/**
 * @internal
 */
function createRoutingDecorator(path: string | RegExp, verb: RoutingMethod): MethodDecorator {
	return (target, methodKey, descriptor: TypedPropertyDescriptor<any>) => {
		const routes: RouteMeta[] = Reflect.getOwnMetadata(Meta.Routes, target) || []
		routes.push({ path, verb, methodKey })
		Reflect.defineMetadata(Meta.Routes, routes, target)
	}
}

/**
 * Retrieve routes of a class.
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractRoutingMethods(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(Meta.Routes, target.prototype) || []
}
