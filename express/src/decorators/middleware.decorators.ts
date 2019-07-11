import META from './metadata-keys'
import { ClassType, RequestHandler, ErrorRequestHandler, GenericDecorator } from '../interfaces'

function defineMeta(when: symbol, middlewares: (RequestHandler | ErrorRequestHandler)[]): GenericDecorator {
	return (target, methodKey, descriptor) => {
		if (methodKey) {
			Reflect.defineMetadata(when, middlewares, target, methodKey)
		} else {
			Reflect.defineMetadata(when, middlewares, target)
		}
	}
}

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export const UseBefore = (...middlewares: RequestHandler[]) => defineMeta(META.USEBEFORE, middlewares)

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export const Use = UseBefore

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export const UseAfter = (...middlewares: RequestHandler[]) => defineMeta(META.USEAFTER, middlewares)

/**
 * @see http://expressjs.com/en/4x/api.html#app.use
 * @public
 */
export const UseCatch = (...errorMiddlewares: ErrorRequestHandler[]) =>
	defineMeta(META.USECATCH, errorMiddlewares)

export function getBeforeMiddlewaresMeta(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	if (methodKey) return Reflect.getOwnMetadata(META.USEBEFORE, target.prototype, methodKey) || []
	return Reflect.getOwnMetadata(META.USEBEFORE, target) || []
}

export function getAfterMiddlewaresMeta(target: ClassType, methodKey?: string | symbol): RequestHandler[] {
	if (methodKey) return Reflect.getOwnMetadata(META.USEAFTER, target.prototype, methodKey) || []
	return Reflect.getOwnMetadata(META.USEAFTER, target) || []
}

export function getCatchMiddlewaresMeta(
	target: ClassType,
	methodKey?: string | symbol
): ErrorRequestHandler[] {
	if (methodKey) return Reflect.getOwnMetadata(META.USECATCH, target.prototype, methodKey) || []
	return Reflect.getOwnMetadata(META.USECATCH, target) || []
}
