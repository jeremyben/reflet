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
 * @public
 */
export type ClassOrTypedMethodDecorator<T> = <TFunction extends Function>(
	target: Object | TFunction,
	propertyKey?: string | symbol,
	descriptor?: MethodDescriptorReturn<T>
) => TFunction extends Function ? any : MethodDescriptorReturn<T> | void

/**
 * {@linkcode TypedPropertyDescriptor}
 * @public
 */
interface MethodDescriptorReturn<T> {
	value?: (...args: any[]) => T
}

/**
 * Defines a class type. Does the opposite of built-in `InstanceType`.
 * @public
 */
export type ClassType = new (...args: any[]) => any

/**
 * @example
 * ```ts
 * const routers: Registration[] = [
 *   ['/foo', Foo],
 *   ['/bar', Bar],
 *   new Baz(),
 * ]
 * register(app, routers)
 * ```
 * ------
 * @public
 */
export type Registration = Registration.Class | Registration.Instance | Registration.Tuple

export namespace Registration {
	/**
	 * @public
	 */
	export type Class = new () => any

	/**
	 * @public
	 */
	export type Instance = object & NotFunction & NotArray

	/**
	 * @public
	 */
	export type Tuple = [path: string | RegExp, router: Registration.Class | Registration.Instance | express.IRouter]
}

/**
 * @public
 */
type NotFunction = { bind?(): never } | { call?(): never } | { apply?(): never }

/**
 * @public
 */
type NotArray = { push?(): never } | { pop?(): never } | { shift?(): never } | { unshift?(): never }

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
 * Only readonly properties and methods from response.
 * @public
 */
export type ResponseReadonly = Pick<
	express.Response,
	| 'statusCode'
	| 'statusMessage'
	| 'locals'
	| 'charset'
	| 'headersSent'
	| 'getHeader'
	| 'getHeaders'
	| 'getHeaderNames'
	| 'hasHeader'
	| 'finished'
	| 'writableEnded'
	| 'writableFinished'
>

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
