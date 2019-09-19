import { Use } from '@reflet/express'
import { Request, Response, NextFunction } from 'express'
import { isPromise } from './type-guards'

/**
 * Middleware to handle authorization.
 *
 * @param guards - functions that should return a boolean (asynchronously or not), indicating the current request is allowed or not. Have access to the Request object.
 *
 * @remarks
 * - returns `true`-> request will be processed.
 * - returns `false`-> request will be denied with a **403** HTTP code and a **"Access Denied"** message.
 *
 * ------
 * Example :
 * ```ts
 * ＠UseGuards(
 *   (req) => req.user != null,
 *   (req) => req.user.admin === true,
 * )
 * ＠Get('/secret')
 * get() {}
 * ```
 * ------
 * Custom message :
 *
 * If you want to override the default 'Access denied' message,
 * you can _return_ (not throw) an `Error` instance instead of just `false`.
 * ```ts
 * ＠UseGuards((req) => Boolean(req.user.admin) || Error('You must be admin'))
 * ```
 * ------
 * @decorator class, method
 * @public
 */
export function UseGuards(...guards: ((req: Request) => boolean | Error | Promise<boolean | Error>)[]) {
	return Use(
		...guards.map((guard) => (req: Request, res: Response, next: NextFunction) => {
			const result = guard(req)

			if (isPromise(result)) result.then((value) => authorize(value))
			else authorize(result)

			// Attach status to error like express does (https://github.com/expressjs/express/blob/4.x/lib/response.js#L676)
			// and set the response status too, in case of a custom error handler not handling error status property.
			function authorize(value: boolean | Error) {
				if (value instanceof Error) {
					const err = value as Error & { status: number }
					err.status = 403
					res.status(403)
					next(err)
				} else if (value) {
					next()
				} else {
					const err = Error('Access Denied') as Error & { status: number }
					err.status = 403
					res.status(403)
					next(err)
				}
			}
		})
	)
}
