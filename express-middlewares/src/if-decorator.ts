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
	return Use<Req>((req, res, next) => {
		const ok = condition(req)

		if (isPromise(ok)) ok.then((yes) => apply(yes), nextOnRejection(next))
		else apply(ok)

		function apply(yes: boolean) {
			if (yes) run(0)
			else next()
		}

		// Apply middlewares one after the other, and stop as soon as one ends the request or passes anything to `next`
		// (an error, 'route' or 'router'), which is forwarded as is to keep the express semantics.
		// Not delegated to an inner express router, which would handle 'route' and 'router' itself and reset `req.params`.
		function run(index: number): void {
			const middleware = middlewares[index]

			if (!middleware) {
				return next()
			}

			const nextMiddleware = (arg?: any) => (arg ? next(arg) : run(index + 1))

			try {
				const result: unknown = middleware(req, res, nextMiddleware)
				// Only native promises, to avoid triggering lazy thenables.
				if (result instanceof Promise) result.catch(nextOnRejection(nextMiddleware))
			} catch (error) {
				nextMiddleware(error)
			}
		}
	})
}
