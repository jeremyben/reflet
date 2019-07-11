import META from './metadata-keys'
import { ClassType } from '../interfaces'

enum VERB {
	GET = 'get',
	POST = 'post',
	PUT = 'put',
	PATCH = 'patch',
	DELETE = 'delete',
}

type RouteMeta = {
	path: string | RegExp
	verb: VERB
	methodKey: string | symbol
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.get.method
 * @public
 */
export function Get(path: string | RegExp = '') {
	return defineRouteMeta(path, VERB.GET)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.post.method
 * @public
 */
export function Post(path: string | RegExp = '') {
	return defineRouteMeta(path, VERB.POST)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.put.method
 * @public
 */
export function Put(path: string | RegExp = '') {
	return defineRouteMeta(path, VERB.PUT)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Patch(path: string | RegExp = '') {
	return defineRouteMeta(path, VERB.PATCH)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.delete.method
 * @public
 */
export function Delete(path: string | RegExp = '') {
	return defineRouteMeta(path, VERB.DELETE)
}

/**
 * @internal
 */
function defineRouteMeta(path: string | RegExp, verb: VERB): MethodDecorator {
	return (target, methodKey, descriptor: TypedPropertyDescriptor<any>) => {
		const routes: RouteMeta[] = Reflect.getOwnMetadata(META.ROUTES, target) || []
		routes.push({ path, verb, methodKey })
		Reflect.defineMetadata(META.ROUTES, routes, target)
	}
}

/**
 * Get all routes defined from the prototype (no need to create an instance)
 * @internal
 */
export function getRoutesMeta(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(META.ROUTES, target.prototype) || []
}
