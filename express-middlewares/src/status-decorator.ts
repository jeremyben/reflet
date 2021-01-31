import { Use } from '@reflet/express'
import { NonErrorStatusCode } from './interfaces'

/**
 * Sets response status.
 * @param statusCode - either a `1XX`, `2XX` or `3XX` status code.
 * @see http://expressjs.com/en/4x/api.html#res.status
 * @example
 * ```ts
 * ＠UseStatus(201)
 * ```
 * ------
 * @public
 */
export function UseStatus<S extends number = NonErrorStatusCode>(
	statusCode: S extends NonErrorStatusCode ? NonErrorStatusCode : number
) {
	return Use((req, res, next) => {
		res.status(statusCode)
		next()
	})
}
