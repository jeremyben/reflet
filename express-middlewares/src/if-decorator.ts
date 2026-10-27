import { Use } from '@reflet/express'
import * as express from 'express'
import { Request } from './interfaces'
import { isPromise } from './type-guards'
import { nextOnRejection } from './next-on-rejection'

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
export function UseIf<Req extends {}>(
	condition: (req: Request<Req>) => boolean | Promise<boolean>,
	middlewares: express.RequestHandler[]
) {
	// Delegate middlewares sequencing to an express router, to keep the exact express semantics
	// (a middleware ending the request or passing an error stops the chain).
	// Merge params to keep access to the parent route parameters.
	const router = express.Router({ mergeParams: true })

	for (const middleware of middlewares) {
		router.use((req, res, next) => {
			const result: unknown = middleware(req, res, next)
			// Only native promises, to avoid triggering lazy thenables.
			if (result instanceof Promise) result.catch(nextOnRejection(next))
		})
	}

	return Use<Req>((req, res, next) => {
		const ok = condition(req)

		if (isPromise(ok)) ok.then((yes) => apply(yes), nextOnRejection(next))
		else apply(ok)

		function apply(yes: boolean) {
			if (yes) router(req as express.Request, res, next)
			else next()
		}
	})
}
