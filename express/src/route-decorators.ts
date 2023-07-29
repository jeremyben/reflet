import { ClassType, PropertyOrMethodDecorator } from './interfaces'
import { getOwnMetadata, defineMetadata } from './metadata-map'

const METAKEY_ROUTE = Symbol('route')

/**
 * @internal
 */
type RouteMeta = {
	readonly path: string | RegExp
	readonly method: Lowercase<Route.Method>
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
export function Get(path: string | RegExp = ''): Route.Decorator {
	return Route('get', path)
}
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
export function Post(path: string | RegExp = ''): Route.Decorator {
	return Route('post', path)
}

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
export function Put(path: string | RegExp = ''): Route.Decorator {
	return Route('put', path)
}

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
export function Patch(path: string | RegExp = ''): Route.Decorator {
	return Route('patch', path)
}

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
export function Delete(path: string | RegExp = ''): Route.Decorator {
	return Route('delete', path)
}

/**
 * Routes an HTTP request.
 * @param method - HTTP method of the request, in lowercase.
 * @param path - path for which the decorated class method is invoked.
 * @see https://expressjs.com/en/4x/api.html#app.METHOD
 * @public
 */
export function Route(method: Route.Method | Route.Method[], path: string | RegExp): Route.Decorator {
	return (target, key, descriptor) => {
		// Attach routes to class instead of methods to extract and traverse all of them at once
		const routes: RouteMeta[] = getOwnMetadata(METAKEY_ROUTE, target) || []

		if (Array.isArray(method)) {
			for (const methodd of method) {
				routes.push({ path, method: methodd.toLowerCase() as Lowercase<Route.Method>, key })
			}
		} else {
			routes.push({ path, method: method.toLowerCase() as Lowercase<Route.Method>, key })
		}

		defineMetadata(METAKEY_ROUTE, routes, target)
	}
}

/* istanbul ignore next */
// tslint:disable: no-shadowed-variable
export namespace Route {
	export function Get(path: string | RegExp = ''): Route.Decorator {
		return Route('get', path)
	}

	export function Post(path: string | RegExp = ''): Route.Decorator {
		return Route('post', path)
	}

	export function Put(path: string | RegExp = ''): Route.Decorator {
		return Route('put', path)
	}

	export function Patch(path: string | RegExp = ''): Route.Decorator {
		return Route('patch', path)
	}

	export function Delete(path: string | RegExp = ''): Route.Decorator {
		return Route('delete', path)
	}

	export function Head(path: string | RegExp = ''): Route.Decorator {
		return Route('head', path)
	}

	export function Options(path: string | RegExp = ''): Route.Decorator {
		return Route('options', path)
	}

	export function Trace(path: string | RegExp = ''): Route.Decorator {
		return Route('trace', path)
	}

	export function Notify(path: string | RegExp = ''): Route.Decorator {
		return Route('notify', path)
	}

	export function Subscribe(path: string | RegExp = ''): Route.Decorator {
		return Route('subscribe', path)
	}

	export function Unsubscribe(path: string | RegExp = ''): Route.Decorator {
		return Route('unsubscribe', path)
	}

	export function Purge(path: string | RegExp = ''): Route.Decorator {
		return Route('purge', path)
	}

	export function Checkout(path: string | RegExp = ''): Route.Decorator {
		return Route('checkout', path)
	}

	export function Move(path: string | RegExp = ''): Route.Decorator {
		return Route('move', path)
	}

	export function Copy(path: string | RegExp = ''): Route.Decorator {
		return Route('copy', path)
	}

	export function Merge(path: string | RegExp = ''): Route.Decorator {
		return Route('merge', path)
	}

	export function Report(path: string | RegExp = ''): Route.Decorator {
		return Route('report', path)
	}

	export function MSearch(path: string | RegExp = ''): Route.Decorator {
		return Route('m-search', path)
	}

	export function Mkactivity(path: string | RegExp = ''): Route.Decorator {
		return Route('mkactivity', path)
	}

	export function Mkcol(path: string | RegExp = ''): Route.Decorator {
		return Route('mkcol', path)
	}

	export function Search(path: string | RegExp = ''): Route.Decorator {
		return Route('search', path)
	}

	export function Lock(path: string | RegExp = ''): Route.Decorator {
		return Route('lock', path)
	}

	export function Unlock(path: string | RegExp = ''): Route.Decorator {
		return Route('unlock', path)
	}

	export function All(path: string | RegExp = ''): Route.Decorator {
		return Route('all', path)
	}

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
		| 'CHECKOUT'
		| 'COPY'
		| 'DELETE'
		| 'GET'
		| 'HEAD'
		| 'LOCK'
		| 'MERGE'
		| 'MKACTIVITY'
		| 'MKCOL'
		| 'MOVE'
		| 'M-SEARCH'
		| 'NOTIFY'
		| 'OPTIONS'
		| 'PATCH'
		| 'POST'
		| 'PURGE'
		| 'PUT'
		| 'REPORT'
		| 'SEARCH'
		| 'SUBSCRIBE'
		| 'TRACE'
		| 'UNLOCK'
		| 'UNSUBSCRIBE'
		| 'ALL'

	/**
	 * Equivalent to an union of `MethodDecorator` and `ProperyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyOrMethodDecorator & { __expressRoute?: never }
}

/**
 * Retrieve routes of a class.
 * @internal
 */
export function extractRoutes(target: ClassType): RouteMeta[] {
	return getOwnMetadata(METAKEY_ROUTE, target.prototype) || []
}
