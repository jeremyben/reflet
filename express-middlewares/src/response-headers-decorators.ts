import { Use } from '@reflet/express'
import { ResponseHeader } from '@reflet/http'

/**
 * Sets response HTTP headers.
 * @see https://expressjs.com/en/api.html#res.set
 * @example
 * ```ts
 * // Single field:
 * ＠UseResponseHeader('allow', 'GET')
 * // Multiple fields:
 * ＠UseResponseHeader({ 'allow': 'GET', 'x-powered-by': 'brainfuck' })
 * ```
 * ------
 * @public
 */
export function UseResponseHeader(field: ResponseHeader, value: string): Use.Decorator

export function UseResponseHeader(headers: ResponseHeader.Record): Use.Decorator

export function UseResponseHeader(field: string | Record<string, any>, value?: string) {
	const headers = typeof field === 'string' ? { [field]: value } : field

	return Use((req, res, next) => {
		res.set(headers)
		next()
	})
}

export namespace UseResponseHeader {
	/**
	 * Appends the specified `value` to the HTTP response header `field`.
	 * @see https://expressjs.com/fr/api.html#res.append
	 * @example
	 * ```ts
	 * ＠UseResponseHeader.Append('link', ['<http://localhost/>', '<http://localhost:3000/>'])
	 * ```
	 * ------
	 * @public
	 */
	export function Append(field: ResponseHeader, value: string | string[]) {
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
 * ＠UseType('json')
 * ```
 * ------
 * @public
 */
export function UseType<T extends string = UseType.CommonType>(
	type: T extends UseType.CommonType ? UseType.CommonType : string
) {
	return Use((req, res, next) => {
		res.type(type)
		next()
	})
}

export namespace UseType {
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
	 * @public
	 */
	export type CommonType =
		| CommonType.Application
		| CommonType.Text
		| CommonType.Font
		| CommonType.Image
		| CommonType.Video
		| CommonType.Audio
		| CommonType.Extension

	export namespace CommonType {
		export type Application =
			| 'application/octet-stream'
			| 'application/json'
			| 'application/javascript'
			| 'application/pdf'
			| 'application/xml'
			| 'application/msword' // doc
			| 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
			| 'application/vnd.ms-excel' // xls
			| 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xslx
			| 'application/vnd.ms-powerpoint' // ppt
			| 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
			| 'application/zip'
			| 'application/gzip'
			| 'application/vnd.rar'
			| 'application/ld+json'
			| 'application/vnd.api+json'

		export type Text = 'text/plain' | 'text/html' | 'text/css' | 'text/csv' | 'text/xml' | 'text/calendar'

		export type Font = 'font/ttf' | 'font/otf' | 'font/woff' | 'font/woff2'

		export type Image =
			| 'image/png'
			| 'image/jpeg'
			| 'image/gif'
			| 'image/bmp'
			| 'image/svg+xml'
			| 'image/x-icon'
			| 'image/vnd.microsoft.icon'
			| 'image/webp'

		export type Video =
			| 'video/mpeg'
			| 'video/x-msvideo'
			| 'video/ogg'
			| 'video/webm'
			| 'video/mp4'
			| 'video/quicktime'

		export type Audio =
			| 'audio/mpeg'
			| 'audio/wav'
			| 'audio/aac'
			| 'audio/midi'
			| 'audio/x-midi'
			| 'audio/ogg'
			| 'audio/webm'

		export type Extension =
			| 'html'
			| 'txt'
			| 'css'
			| 'csv'
			| 'ics'
			| 'png'
			| 'jpeg'
			| 'gif'
			| 'svg'
			| 'bin'
			| 'js'
			| 'json'
			| 'xml'
			| 'zip'
			| 'gz'
			| 'rar'
			| 'doc'
			| 'docx'
			| 'xls'
			| 'xlsx'
			| 'ppt'
			| 'pptx'
			| 'pdf'
	}
}
