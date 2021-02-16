import * as express from 'express'
import * as core from 'express-serve-static-core'

/**
 * Exported decorators interfaces.
 * Branded as distinct symbols for the dedicated linter and the compiler API.
 * @public
 */
export namespace Decorator {
	/**
	 * Used for `@Router` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Router = ClassDecorator & { __expressRouter?: never }

	/**
	 * Used for `@Get, @Post, @Put, @Patch, @Delete, @Method` decorators.
	 * Equivalent to `MethodDecorator`.
	 * @public
	 */
	export type Route<T extends RoutingMethod> = PropertyOrMethodDecorator & { __expressRoute?: T }

	/**
	 * Used for `createParamDecorator`.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type HandlerParameter = ParameterDecorator & { __expressHandlerParameter?: never }

	/**
	 * Used for `@Req` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Req = ParameterDecorator & { __expressReq?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Res` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Res = ParameterDecorator & { __expressRes?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Next` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Next = ParameterDecorator & { __expressNext?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Body` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Body = ParameterDecorator & { __expressBody?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Params` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Params = ParameterDecorator & { __expressParams?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Query` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Query = ParameterDecorator & { __expressQuery?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Headers` decorator.
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Headers = ParameterDecorator & { __expressHeaders?: never; __expressHandlerParameter?: never }

	/**
	 * Used for `@Use` decorator.
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Use<T extends ClassOrMethodUnion = 'class|method'> = ClassOrMethodDecorator<T> & {
		__expressUse?: never
	}

	/**
	 * Used for `@Catch` decorator.
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Catch<T extends ClassOrMethodUnion = 'class|method'> = ClassOrMethodDecorator<T> & {
		__expressCatch?: never
	}

	/**
	 * Used for `@Send` decorator.
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Send<T extends ClassOrMethodUnion = 'class|method'> = ClassOrMethodDecorator<T> & {
		__expressSend?: never
	}

	/**
	 * Used for `@Send.Dont` decorator.
	 * Equivalent to `MethodDecorator`.
	 * @public
	 */
	export type DontSend = MethodDecorator & { __expressDontSend?: never }
}

/**
 * @public
 */
type ClassOrMethodUnion = 'class' | 'method' | 'class|method'

/**
 * Generic decorator type to choose beetween `ClassDecorator`, `MethodDecorator`, or both.
 * @public
 */
type ClassOrMethodDecorator<T extends ClassOrMethodUnion = 'class|method'> = T extends 'class'
	? ClassDecorator
	: T extends 'method'
	? MethodDecorator
	: T extends 'class|method'
	? <TFunction extends Function>(
			target: TFunction | Object,
			propertyKey?: string | symbol,
			descriptor?: TypedPropertyDescriptor<any>
	  ) => any
	: never

/**
 * @public
 */
type PropertyOrMethodDecorator = (
	target: Object,
	propertyKey: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Defines a class type. Does the opposite of built-in `InstanceType`.
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * @public
 */
export type ObjectInstance = object & {
	[Symbol.hasInstance]?(value: any): never // not a function
	[Symbol.iterator]?(): never // not an array
}

/**
 * @example
 * ```ts
 * const controllers: Controllers = [
 *   { path: '/foo', router: Foo },
 *   { path: '/bar', router: Bar },
 *   { path: '/baz', router: Baz },
 * ]
 * register(app, controllers)
 * ```
 * ------
 * @public
 */
export type Controllers =
	| ((new () => any) | ObjectInstance)[]
	| { path: string | RegExp; router: (new () => any) | ObjectInstance | express.IRouter }[]

/**
 * @public
 */
export interface Handler<Req extends {} = {}> {
	(
		req: keyof Req extends undefined
			? express.Request
			: express.Request<
					Req extends { params: infer P } ? P : core.ParamsDictionary,
					any,
					Req extends { body: infer B } ? B : any,
					Req extends { query: infer Q } ? Q : core.Query
			  > &
					Req,
		res: express.Response,
		next: express.NextFunction
	): any
}

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
	| StatusCode.Information
	| StatusCode.Success
	| StatusCode.Redirection
	| StatusCode.ClientError
	| StatusCode.ServerError

export namespace StatusCode {
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

	export type _Router = {
		params: { [key: string]: any }
		_params: any[]
		caseSensitive: boolean
		mergeParams: boolean | undefined
		strict: boolean | undefined
		stack: Layer[]
	}

	type Layer = {
		// prevent ts4033 or ts2717 errors on build
		handle: import('express').RequestHandler | (import('express').RequestHandler & _Router)
		name: string // '<anonymous>' | 'query' | 'expressInit' | 'bound dispatch' | 'router' | 'serveStatic' | 'jsonParser' | 'urlencodedParser'
		params: { [key: string]: any } | undefined
		path: string | undefined
		keys: { name: string; optional: boolean; offset: number }[]
		regexp: RegExp & { fast_star: boolean; fast_slash: boolean }
		route: LayerRoute | undefined
	}

	type LayerRoute = {
		path: string
		methods: { [key in RoutingMethod]?: true }
		stack: {
			handle: import('express').RequestHandler
			name: string
			params: { [key: string]: any } | undefined
			path: string | undefined
			keys: { name: string; optional: boolean; offset: number }[]
			regexp: RegExp
			method: RoutingMethod
		}[]
	}
}
