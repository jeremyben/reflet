import Meta from './metadata-keys'
import { RouterOptions } from 'express'
import { ClassType, Decorator } from './interfaces'

/**
 * @internal
 */
type RouterMeta = { root: string | RegExp; options?: RouterOptions }

/**
 * Creates and attaches an express Router object to a controller class.
 * The routes in the controller class to which the decorator is applied will be attached to the newly created router at its `root` path.
 * @param root - root path of the router.
 * @param options - specifies router behavior.
 *
 * @see https://expressjs.com/en/4x/api.html#router
 * @example
 * ```ts
 * ＠Router('/things')
 * class Foo {
 *   ＠Get()
 *   list(req: Request, res: Response, next: NextFunction) {}
 *
 *   ＠Get('/:id')
 *   get(req: Request, res: Response, next: NextFunction) {}
 * }
 * ```
 * ------
 *
 * @public
 */
export function Router(root: string | RegExp, options?: RouterOptions): Decorator.Router {
	return (target) => {
		Reflect.defineMetadata(Meta.Router, { root, options }, target)
	}
}

/**
 * @internal
 */
export function extractRouter(target: ClassType): RouterMeta | undefined {
	return Reflect.getOwnMetadata(Meta.Router, target)
}
