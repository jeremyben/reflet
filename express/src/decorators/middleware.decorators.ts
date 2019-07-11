import META from './metadata-keys'
import { ClassType, RequestHandler, ErrorRequestHandler, GenericDecorator } from '../interfaces'

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseBefore(...middlewares: RequestHandler[]) {
	return defineMiddlewareMeta(META.USEBEFORE, middlewares)
}

export { UseBefore as Use }

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseAfter(...middlewares: RequestHandler[]) {
	return defineMiddlewareMeta(META.USEAFTER, middlewares)
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export function UseCatch(...errorMiddlewares: ErrorRequestHandler[]) {
	return defineMiddlewareMeta(META.USECATCH, errorMiddlewares)
}

/**
 * @internal
 */
function defineMiddlewareMeta(
	type: symbol,
	middlewares: (RequestHandler | ErrorRequestHandler)[]
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
export function getBeforeMiddlewaresMeta(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(META.USEBEFORE, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(META.USEBEFORE, target) || []
}

/**
 * @internal
 */
export function getAfterMiddlewaresMeta(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(META.USEAFTER, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(META.USEAFTER, target) || []
}

/**
 * @internal
 */
export function getCatchMiddlewaresMeta(
	target: ClassType,
	methodKey?: string | symbol
): ErrorRequestHandler[] {
	// Method middlewares
	if (methodKey) return Reflect.getOwnMetadata(META.USECATCH, target.prototype, methodKey) || []
	// Class middlewares
	return Reflect.getOwnMetadata(META.USECATCH, target) || []
}
