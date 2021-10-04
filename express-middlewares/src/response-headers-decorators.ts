import { Use, Decorator } from '@reflet/express'
import { ResponseHeaderName, CommonType } from './interfaces'

/**
 * Sets response HTTP headers.
 * @see https://expressjs.com/en/api.html#res.set
 * @example
 * ```ts
 * // Single field:
 * ＠UseHeader('allow', 'GET')
 * // Multiple fields:
 * ＠UseHeader({ 'allow': 'GET', 'x-powered-by': 'brainfuck' })
 * ```
 * ------
 * @public
 */
export function UseHeader<H extends string = ResponseHeaderName>(
	field: H extends ResponseHeaderName ? ResponseHeaderName : string,
	value: string
): Decorator.Use

export function UseHeader<H extends string = ResponseHeaderName>(headers: ResponseHeaders<H>): Decorator.Use

export function UseHeader(field: string | ResponseHeaders, value?: string) {
	const headers: ResponseHeaders = typeof field === 'string' ? { [field]: value } : field

	return Use((req, res, next) => {
		res.set(headers)
		next()
	})
}

export namespace UseHeader {
	/**
	 * Appends the specified `value` to the HTTP response header `field`.
	 * @see https://expressjs.com/fr/api.html#res.append
	 * @example
	 * ```ts
	 * ＠UseHeader.Append('link', ['<http://localhost/>', '<http://localhost:3000/>'])
	 * ```
	 * ------
	 * @public
	 */
	export function Append<H extends string = ResponseHeaderName>(
		field: H extends ResponseHeaderName ? ResponseHeaderName : string,
		value: string | string[]
	) {
		return Use((req, res, next) => {
			res.append(field, value)
			next()
		})
	}
}

/**
 * Sets the `Content-Type` HTTP header to the specified MIME type.
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
/**
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 * @public
 */
type ResponseHeaders<H extends string = ResponseHeaderName> = H extends ResponseHeaderName
	? { [name in ResponseHeaderName]?: string }
	: { [name: string]: string }
