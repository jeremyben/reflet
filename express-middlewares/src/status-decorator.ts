import { Use } from '@reflet/express'
import { NonErrorStatusCode } from './interfaces'

/**
 * Sets response status.
 *
 * @param statusCode - either a `1XX`, `2XX` or `3XX` status code.
 *
 * @see http://expressjs.com/en/4x/api.html#res.status
 *
 * @decorator class, method
 * @public
 */
export function UseStatus<T extends number = NonErrorStatusCode>(
	statusCode: T extends NonErrorStatusCode ? NonErrorStatusCode : number
) {
	return Use((req, res, next) => {
		res.status(statusCode)
		next()
	})
}
