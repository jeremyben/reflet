import { Use, Decorator } from '@reflet/express'
import { ResponseHeaderName, CommonType } from './interfaces'

/**
 * Sets response HTTP headers.
 * Aliased as `@UseSet` and `@UseHeader`.
 * @see https://expressjs.com/en/api.html#res.set
 * @example
 * ```ts
 * // Single field:
 * ＠UseSet('allow', 'GET')
 * // Multiple fields:
 * ＠UseSet({ 'allow': 'GET', 'x-powered-by': 'brainfuck' })
 * ```
 * ------
 * @public
 */
export function UseSet<H extends string = ResponseHeaderName>(
	field: H extends ResponseHeaderName ? ResponseHeaderName : string,
	value: string
): Decorator.Use

export function UseSet<H extends string = ResponseHeaderName>(headers: ResponseHeaders<H>): Decorator.Use

export function UseSet(field: string | ResponseHeaders, value?: string) {
	const headers: ResponseHeaders = typeof field === 'string' ? { [field]: value } : field

	return Use((req, res, next) => {
		res.set(headers)
		next()
	})
}

// Same alias as in express https://github.com/expressjs/express/blob/4.x/lib/response.js#L750
export { UseSet as UseHeader }

/**
 * Sets the `Content-Type` HTTP header to the specified MIME type.
 * Aliased as `@UseType` and `@UseContentType`.
 * @see https://expressjs.com/en/api.html#res.type
 * @example
 * ```ts
 * ＠UseType('application/json')
 * ```
 * ------
 * @public
 */
export function UseType<T extends string = CommonType>(type: T extends CommonType ? CommonType : string) {
	return Use((req, res, next) => {
		res.type(type)
		next()
	})
}

// Same alias as in express https://github.com/expressjs/express/blob/4.x/lib/response.js#L589
export { UseType as UseContentType }

/**
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 * @public
 */
type ResponseHeaders<H extends string = ResponseHeaderName> = H extends ResponseHeaderName
	? { [name in ResponseHeaderName]?: string }
	: { [name: string]: string }
