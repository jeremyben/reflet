import Meta from './metadata-keys'
import { ClassType } from '../interfaces'

/**
 * Must match the express methods.
 */
enum Verb {
	Get = 'get',
	Post = 'post',
	Put = 'put',
	Patch = 'patch',
	Delete = 'delete',
	Head = 'head',
	Options = 'options',
	All = 'all',
}

type RouteMeta = {
	path: string | RegExp
	verb: Verb
	methodKey: string | symbol
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.get.method
 * @public
 */
export function Get(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Get)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.post.method
 * @public
 */
export function Post(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Post)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.put.method
 * @public
 */
export function Put(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Put)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Patch(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Patch)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.delete.method
 * @public
 */
export function Delete(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Delete)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Head(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Head)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Options(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.Options)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.all
 * @public
 */
export function All(path: string | RegExp = '') {
	return defineRouteMeta(path, Verb.All)
}

/**
 * @internal
 */
function defineRouteMeta(path: string | RegExp, verb: Verb): MethodDecorator {
	return (target, methodKey, descriptor: TypedPropertyDescriptor<any>) => {
		const routes: RouteMeta[] = Reflect.getOwnMetadata(Meta.Routes, target) || []
		routes.push({ path, verb, methodKey })
		Reflect.defineMetadata(Meta.Routes, routes, target)
	}
}

/**
 * Get all routes defined from the prototype (no need to create an instance)
 * @internal
 */
export function getRoutesMeta(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(Meta.Routes, target.prototype) || []
}
