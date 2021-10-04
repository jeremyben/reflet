import * as express from 'express'
import * as core from 'express-serve-static-core'

/**
 * @public
 */
export type ClassOrMethodDecorator = <TFunction extends Function>(
	target: TFunction | Object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * @public
 */
export type PropertyOrMethodDecorator = (
	target: Object,
	propertyKey: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Defines a class type. Does the opposite of built-in `InstanceType`.
 * @public
 */
export type ClassType = new (...args: any[]) => any

/**
 * @public
 */
export type ClassInstance = object & NotFunction & NotArray

type NotFunction = { bind?(): never } | { call?(): never } | { apply?(): never }

type NotArray = { push?(): never } | { pop?(): never } | { shift?(): never } | { unshift?(): never }

/**
 * @example
 * ```ts
 * const routers: RegistrationArray = [
 *   { path: '/foo', router: Foo },
 *   { path: '/bar', router: Bar },
 *   new Baz(),
 * ]
 * register(app, routers)
 * ```
 * ------
 * @public
 */
export type RegistrationArray = (
	| (new () => any)
	| ClassInstance
	| { path: string | RegExp; router: (new () => any) | ClassInstance | express.IRouter }
)[]

/**
 * @public
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

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
		handle:
			| (import('express').RequestHandler & _Router)
			| import('express').RequestHandler
			| import('express').ErrorRequestHandler
		name: string // '<anonymous>' | 'query' | 'expressInit' | 'bound dispatch' | 'router' | 'serveStatic' | 'jsonParser' | 'urlencodedParser'
		params: { [key: string]: any } | undefined
		path: string | undefined
		keys: { name: string; optional: boolean; offset: number }[]
		regexp: RegExp & { fast_star: boolean; fast_slash: boolean }
		route: LayerRoute | undefined
	}

	type LayerRoute = {
		path: string
		methods: { [method: string]: true }
		stack: {
			handle: import('express').RequestHandler
			name: string
			params: { [key: string]: any } | undefined
			path: string | undefined
			keys: { name: string; optional: boolean; offset: number }[]
			regexp: RegExp
			method: string
		}[]
	}
}
