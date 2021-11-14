import { Use } from '@reflet/express'
import * as express from 'express'
import { Request } from './interfaces'
import { isPromise } from './type-guards'

// To avoid crashing the server if the user has not installed reflet/http.
let ForbiddenError: Function
try {
	ForbiddenError = (require('@reflet/http') as typeof import('@reflet/http')).HttpError.Forbidden
} catch (err) {
	console.warn(`RefletExpressWarning: The peer dependency "@reflet/http" is not installed.`)
	ForbiddenError = Error
}

/**
 * Middleware to handle authorization.
 *
 * @param guards - functions that should return a boolean (asynchronously or not), indicating the current request is allowed or not:
 * - returns `true`-> request will be processed.
 * - returns `false`-> request will be denied with a **403** HTTP code and a "Access Denied" message.
 *
 * @example
 * ```ts
 * ＠UseGuards(
 *   (req) => req.user != null,
 *   (req) => req.user.admin === true,
 * )
 * ＠Get('/secret')
 * get() {}
 * ```
 * ------
 * **Custom message:**
 * If you want to override the default "Access denied" message,
 * you can _return_ (not throw) an `Error` instance instead of just `false`.
 * @example
 * ```ts
 * ＠UseGuards((req) => Boolean(req.user.admin) || Error('You must be admin'))
 * ```
 * ------
 * @public
 */
export function UseGuards<Req extends {}>(
	...guards: ((req: Request<Req>) => boolean | Error | Promise<boolean | Error>)[]
) {
	return Use(
		...guards.map((guard) => (req: Request<Req>, res: express.Response, next: express.NextFunction) => {
			const result = guard(req)

			if (isPromise(result)) {
				result.then((value) => authorize(value))
			} else {
				authorize(result)
			}

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
					const err = ForbiddenError('Access Denied')
					res.status(403)
					next(err)
				}
			}
		})
	)
}
