import META from './metadata-keys'

type RouterMeta = { prefix: string | RegExp; options?: import('express').RouterOptions }

/**
 * @see https://expressjs.com/en/4x/api.html#express.router
 * @public
 */
export function Router(prefix: RouterMeta['prefix'], options?: RouterMeta['options']): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(META.ROUTER, { prefix, options }, target)
	}
}

export function getRouterMeta(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(META.ROUTER, target)
}
