/**
 * Defines a JS class type.
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

export type Application = import('express').Application
export type RouterOptions = import('express').RouterOptions
export type Request = import('express').Request
export type Response = import('express').Response
export type NextFunction = import('express').NextFunction
export type RequestHandler = import('express').RequestHandler
export type ErrorRequestHandler = import('express').ErrorRequestHandler
