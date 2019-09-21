import Meta from './metadata-keys'
import { ClassType } from './interfaces'
import { RouterOptions } from 'express'

type RouterMeta = { root: string | RegExp; options?: RouterOptions }

/**
 * Creates and attaches an express Router object to a controller class.
 *
 * @param root - root path of the router.
 * @param options - specifies router behavior.
 *
 * @remarks
 * The routes in the controller class to which the decorator is applied
 * will be attached to the newly created router at its `root` path.
 *
 * ------
 * Example :
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
 * @see https://expressjs.com/en/4x/api.html#router
 *
 * @decorator class
 * @public
 */
export function Router(root: string | RegExp, options?: RouterOptions): ClassDecorator {
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
