import { Use } from '@reflet/express'

/**
 * Sets response status.
 *
 * @param statusCode - either a `1XX`, `2XX` or `3XX` status code.
 *
 * @see http://expressjs.com/en/4x/api.html#res.status
 * @decorator
 * @public
 */
export function UseStatus<T extends number = NonErrorStatusU>(
	statusCode: T extends NonErrorStatusU ? NonErrorStatusU : number
) {
	return Use((req, res, next) => {
		res.status(statusCode)
		next()
	})
}

/**
 * @public
 */
type NonErrorStatusU = InformationStatusU | SuccessStatusU | RedirectionStatusU

/**
 * @public
 */
type InformationStatusU = 100 | 101 | 102 | 103

/**
 * @public
 */
type SuccessStatusU = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226

/**
 * @public
 */
type RedirectionStatusU = 300 | 301 | 302 | 303 | 304 | 307 | 308
