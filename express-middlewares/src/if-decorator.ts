import { Use } from '@reflet/express'
import { Request, RequestHandler } from 'express'
import { isPromise } from './type-guards'

/**
 * Applies middlewares conditionally.
 * @param condition - function that should return a boolean (asynchronously or not). Has access to the Request object.
 * @param middlewares - middlewares that are applied in case the condition returns `true`.
 *
 * @example
 * ```ts
 * ＠UseIf((req) => req.method === 'POST', [express.json()])
 * ```
 * ------
 * @public
 */
export function UseIf(
	condition: (req: Request) => boolean | Promise<boolean>,
	middlewares: RequestHandler[]
) {
	return Use((req, res, next) => {
		const ok = condition(req)

		if (isPromise(ok)) ok.then((yes) => apply(yes))
		else apply(ok)

		function apply(yes: boolean) {
			if (yes) for (const middleware of middlewares) middleware(req, res, next)
			else next()
		}
	})
}
