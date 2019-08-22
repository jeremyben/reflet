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

// Centralize Express types
export type Application = import('express').Application
export type RouterOptions = import('express').RouterOptions
export type Request = import('express').Request
export type Response = import('express').Response
export type NextFunction = import('express').NextFunction
export type RequestHandler = import('express').RequestHandler
export type ErrorRequestHandler = import('express').ErrorRequestHandler
export type RoutingMethod = Exclude<keyof import('express').IRoute, 'path' | 'stack'>
