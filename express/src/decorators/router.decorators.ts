import META from './metadata-keys'
import { ClassType, RouterOptions } from '../interfaces'

type RouterMeta = { prefix: string | RegExp; options?: RouterOptions }

/**
 * @see https://expressjs.com/en/4x/api.html#express.router
 * @public
 */
export function Router(prefix: string | RegExp, options?: RouterOptions): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(META.ROUTER, { prefix, options }, target)
	}
}

/**
 * @internal
 */
export function getRouterMeta(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(META.ROUTER, target)
}
