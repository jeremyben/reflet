import Meta from './metadata-keys'
import { ClassType, RequestHandler, ErrorRequestHandler, GenericDecorator } from '../interfaces'

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseBefore(...middlewares: RequestHandler[]) {
	return defineMiddlewareMeta(Meta.UseBefore, middlewares)
}

export { UseBefore as Use }

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseAfter(...middlewares: RequestHandler[]) {
	return defineMiddlewareMeta(Meta.UseAfter, middlewares)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseCatch(...errorMiddlewares: ErrorRequestHandler[]) {
	return defineMiddlewareMeta(Meta.UseCatch, errorMiddlewares)
}

/**
 * @internal
 */
function defineMiddlewareMeta(
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
 * @internal
 */
export function getBeforeMiddlewares(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseBefore, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseBefore, target) || []
}

/**
 * @internal
 */
export function getAfterMiddlewares(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseAfter, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseAfter, target) || []
}

/**
 * @internal
 */
export function getCatchMiddlewares(target: ClassType, methodKey?: string | symbol): ErrorRequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(Meta.UseCatch, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(Meta.UseCatch, target) || []
}
