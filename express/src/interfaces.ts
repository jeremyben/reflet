/**
 * Defines a class type. Does the opposite of built-in `InstanceType`.
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * @public
 */
export type Fn<T = any> = (...args: any[]) => T

/**
 * Equivalent to native ClassDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type RouterDecorator = <T extends Function>(target: T) => T | void

/**
 * Equivalent to native MethodDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type RouteDecorator = (
	target: object,
	key: string | symbol,
	descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void

/**
 * Equivalent to native ParameterDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type HandlerParameterDecorator = (
	target: object,
	propertyKey: string | symbol,
	parameterIndex: number
) => void

/**
 * Equivalent to a union of native ClassDecorator and MethodDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type MiddlewareDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Equivalent to a union of native ClassDecorator and MethodDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type ErrorHandlerDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Equivalent to a union of native ClassDecorator and MethodDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type SendDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Equivalent to native MethodDecorator.
 * Used as a distinct symbol for the compiler API.
 * @public
 */
export type DontSendDecorator = (
	target: object,
	key: string | symbol,
	descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void

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
	| 'all'

/**
 * @public
 */
export type StatusCode =
	| StatusCodes.Information
	| StatusCodes.Success
	| StatusCodes.Redirection
	| StatusCodes.ClientError
	| StatusCodes.ServerError

namespace StatusCodes {
	export type Information = 100 | 101 | 102 | 103
	export type Success = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
	export type Redirection = 300 | 301 | 302 | 303 | 304 | 307 | 308
	// prettier-ignore
	export type ClientError = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
	export type ServerError = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511
}

declare module 'express' {
	export interface Application {
		_router: _Router
	}

	// prevent ts4033 or ts2717 errors on build
	type RequestHandler_ = import('express').RequestHandler

	export type _Router = {
		params: {}
		_params: any[]
		caseSensitive: boolean
		mergeParams: boolean | undefined
		strict: boolean | undefined
		stack: Layer[]
	}

	type Layer = {
		handle: RequestHandler_ | RequestHandler_ & _Router
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
			handle: RequestHandler_
			name: string
			params: {} | undefined
			path: string | undefined
			keys: { name: string; optional: boolean; offset: number }[]
			regexp: RegExp
			method: RoutingMethod
		}[]
	}
}
