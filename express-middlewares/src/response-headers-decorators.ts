import { Use } from '@reflet/express'
import { ClassOrMethodDecorator } from './interfaces'

/**
 * Sets response HTTP headers.
 *
 * @remarks
 * Aliased as `@UseSet` and `@UseHeader`.
 *
 * ------
 * Example :
 * ```ts
 * // Single field:
 * ＠UseSet('allow', 'GET')
 *
 * // Multiple fields:
 * ＠UseSet({
 *   'allow': 'GET',
 *   'x-powered-by': 'brainfuck'
 * })
 * ```
 * ------
 * @see https://expressjs.com/en/api.html#res.set
 *
 * @decorator class, method
 * @public
 */
export function UseSet<T extends string = ResponseHeaderName>(
	field: T extends ResponseHeaderName ? ResponseHeaderName : string,
	value: string
): ClassOrMethodDecorator

/**
 * {@inheritDoc (UseSet:1)}
 */
export function UseSet<T extends string = ResponseHeaderName>(
	headers: ResponseHeaders<T>
): ClassOrMethodDecorator

export function UseSet(field: string | ResponseHeaders, value?: string): ClassOrMethodDecorator {
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
 *
 * @remarks
 * Aliased as `@UseType` and `@UseContentType`.
 *
 * ------
 * Example :
 * ```ts
 * ＠UseType('application/json')
 * ```
 * ------
 * @see https://expressjs.com/en/api.html#res.type
 *
 * @decorator class, method
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
type ResponseHeaders<T extends string = ResponseHeaderName> = T extends ResponseHeaderName
	? ({ [name in ResponseHeaderName]?: string })
	: { [name: string]: string }

/**
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 * @public
 */
type ResponseHeaderName =
	| 'access-control-allow-origin'
	| 'access-control-allow-credentials'
	| 'access-control-allow-headers'
	| 'access-control-allow-methods'
	| 'access-control-expose-headers'
	| 'access-control-max-age'
	| 'service-worker-allowed'
	| 'timing-allow-origin'
	| 'x-permitted-cross-domain-policies'
	| 'www-authenticate'
	| 'proxy-authenticate'
	| 'cache-control'
	| 'pragma'
	| 'age'
	| 'clear-site-data'
	| 'expires'
	| 'referrer-policy'
	| 'server'
	| 'content-disposition'
	| 'location'
	| 'via'
	| 'last-modified'
	| 'etag'
	| 'vary'
	| 'accept-ranges'
	| 'transfer-encoding'
	| 'trailer'
	| 'set-cookie'
	| 'tk'
	| 'connection'
	| 'keep-alive'
	| 'cross-origin-opener-policy'
	| 'cross-origin-resource-policy'
	| 'content-security-policy'
	| 'content-security-policy-report-only'
	| 'expect-ct'
	| 'feature-policy'
	| 'public-key-pins'
	| 'public-key-pins-report-only'
	| 'strict-transport-security'
	| 'x-content-type-options'
	| 'x-download-options'
	| 'x-frame-options'
	| 'x-powered-by'
	| 'x-xss-protection'
	| 'warning'
	| 'date'
	| 'upgrade'
	| 'accept-patch'
	| 'alt-svc'
	| 'retry-after'
	| 'x-dns-prefetch-control'
	| 'sourcemap'
	| 'large-allocation'
	| 'server-timing'
	| 'x-ua-compatible'
	| 'x-robots-tag'
	| 'content-length'
	| 'content-type'
	| 'content-encoding'
	| 'content-language'
	| 'content-location'
	| 'content-range'
	| 'content-md5'
	| 'allow'
	| 'link'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
 * @public
 */
type CommonType = ApplicationType | TextType | FontType | ImageType | VideoType | AudioType

type ApplicationType =
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
	| 'application/ld+json'
	| 'application/vnd.api+json'

type TextType = 'text/plain' | 'text/html' | 'text/css' | 'text/csv' | 'text/xml' | 'text/calendar'

type FontType = 'font/ttf' | 'font/otf' | 'font/woff' | 'font/woff2'

type ImageType =
	| 'image/png'
	| 'image/jpeg'
	| 'image/gif'
	| 'image/bmp'
	| 'image/svg+xml'
	| 'image/x-icon'
	| 'image/webp'

type VideoType = 'video/mpeg' | 'video/x-msvideo' | 'video/ogg' | 'video/webm'

type AudioType =
	| 'audio/mpeg'
	| 'audio/wav'
	| 'audio/aac'
	| 'audio/midi'
	| 'audio/x-midi'
	| 'audio/ogg'
	| 'audio/webm'
