/**
 * Defines a class type. Does the opposite of built-in `InstanceType`.
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * Defines any type of decorator.
 * @public
 */
export type GenericDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptorOrIndex?: TypedPropertyDescriptor<any> | number
) => any

/**
 * Request headers union.
 * @public
 */
export type RequestHeaderName =
	| 'access-control-request-headers'
	| 'access-control-request-method'
	| 'origin'
	| 'authorization'
	| 'proxy-authorization'
	| 'accept'
	| 'accept-charset'
	| 'accept-encoding'
	| 'accept-language'
	| 'cache-control'
	| 'pragma'
	| 'te'
	| 'from'
	| 'host'
	| 'referer'
	| 'user-agent'
	| 'expect'
	| 'max-forwards'
	| 'forwarded'
	| 'x-forwarded-for'
	| 'x-forwarded-host'
	| 'x-forwarded-proto'
	| 'via'
	| 'if-match'
	| 'if-none-match'
	| 'if-modified-since'
	| 'if-unmodified-since'
	| 'range'
	| 'if-range'
	| 'cookie'
	| 'dnt'
	| 'connection'
	| 'keep-alive'
	| 'content-disposition'
	| 'upgrade-insecure-requests'
	| 'x-requested-with'
	| 'x-csrf-token'
	| 'save-data'
	| 'warning'
	| 'date'
	| 'upgrade'
	| 'x-http-method-override'
	| 'http2-settings'
	| 'content-length'
	| 'content-type'
	| 'content-md5'

/**
 * @see http://expressjs.com/en/4x/api.html#routing-methods
 * @public
 */
export type RoutingMethod =
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

declare module 'express' {
	export interface Application {
		_router: _Router
	}

	export type _Router = {
		params: {}
		_params: any[]
		caseSensitive: boolean
		mergeParams: boolean | undefined
		strict: boolean | undefined
		stack: Layer[]
	}

	type Layer = {
		handle: RequestHandler | RequestHandler & _Router
		name:
			| '<anonymous>'
			| 'query'
			| 'expressInit'
			| 'bound dispatch'
			| 'router'
			| 'serveStatic'
			| 'jsonParser'
			| 'urlencodedParser'
		params: {} | undefined
		path: string | undefined
		keys: { name: string; optional: boolean; offset: number }[]
		regexp: RegExp & { fast_star: boolean; fast_slash: boolean }
		route: LayerRoute | undefined
	}

	type LayerRoute = {
		path: string
		methods: { [key in RoutingMethod]?: true }
		stack: {
			handle: RequestHandler
			name: string
			params: {} | undefined
			path: string | undefined
			keys: { name: string; optional: boolean; offset: number }[]
			regexp: RegExp
			method: RoutingMethod
		}[]
	}
}
