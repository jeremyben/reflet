const META = '_ROUTES_'

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

function defineMeta(path: string | RegExp, verb: VERB): MethodDecorator {
	return (target, methodKey, descriptor: TypedPropertyDescriptor<any>) => {
		const routes: RouteMeta[] = Reflect.getOwnMetadata(META, target) || []
		routes.push({ path, verb, methodKey })

		Reflect.defineMetadata(META, routes, target)
	}
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.get.method
 * @public
 */
export const Get = (path: string | RegExp = '') => defineMeta(path, VERB.GET)

/**
 * @see http://expressjs.com/en/4x/api.html#app.post.method
 * @public
 */
export const Post = (path: string | RegExp = '') => defineMeta(path, VERB.POST)

/**
 * @see http://expressjs.com/en/4x/api.html#app.put.method
 * @public
 */
export const Put = (path: string | RegExp = '') => defineMeta(path, VERB.PUT)

/**
 * @see http://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export const Patch = (path: string | RegExp = '') => defineMeta(path, VERB.PATCH)

/**
 * @see http://expressjs.com/en/4x/api.html#app.delete.method
 * @public
 */
export const Delete = (path: string | RegExp = '') => defineMeta(path, VERB.DELETE)

/**
 * Get all routes defined from the prototype (no need to create an instance)
 */
export function getRoutesMeta(target: ClassType): RouteMeta[] {
	return Reflect.getOwnMetadata(META, target.prototype) || []
}
