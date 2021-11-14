import { Use } from '@reflet/express'
import { Status } from '@reflet/http'

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
export function UseStatus(statusCode: Status.Information | Status.Success | Status.Redirection) {
	return Use((req, res, next) => {
		res.status(statusCode)
		next()
	})
}
