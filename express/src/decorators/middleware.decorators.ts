import Meta from './metadata-keys'
import { RequestHandler, ErrorRequestHandler } from 'express'
import { ClassType, GenericDecorator } from '../interfaces'

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseBefore(...middlewares: RequestHandler[]) {
	return createMiddlewareDecorator(Meta.UseBefore, middlewares)
}

export { UseBefore as Use }

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseAfter(...middlewares: RequestHandler[]) {
	return createMiddlewareDecorator(Meta.UseAfter, middlewares)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseCatch(...errorMiddlewares: ErrorRequestHandler[]) {
	return createMiddlewareDecorator(Meta.UseCatch, errorMiddlewares)
}

/**
 * @internal
 */
function createMiddlewareDecorator(
	type: symbol,
	middlewares: Array<RequestHandler | ErrorRequestHandler>
): GenericDecorator {
	return (target, methodKey, descriptor) => {
		// Method middleware
		if (methodKey) Reflect.defineMetadata(type, middlewares, target, methodKey)
		// Class middleware
		else Reflect.defineMetadata(type, middlewares, target)
	}
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractBeforeMiddlewares(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseBefore, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseBefore, target) || []
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractAfterMiddlewares(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseAfter, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseAfter, target) || []
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractCatchMiddlewares(
	target: ClassType,
	methodKey?: string | symbol
): ErrorRequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseCatch, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseCatch, target) || []
}
