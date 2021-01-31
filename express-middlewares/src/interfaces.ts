import * as express from 'express'
import * as core from 'express-serve-static-core'

/**
 * @public
 */
export type Request<Req extends {} = {}> = keyof Req extends undefined
	? express.Request
	: express.Request<
			Req extends { params: infer P } ? P : core.ParamsDictionary,
			any,
			Req extends { body: infer B } ? B : any,
			Req extends { query: infer Q } ? Q : core.Query
	  > &
			Req

/**
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 * @public
 */
export type ResponseHeaderName =
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
export type CommonType =
	| CommonTypes.Application
	| CommonTypes.Text
	| CommonTypes.Font
	| CommonTypes.Image
	| CommonTypes.Video
	| CommonTypes.Audio

namespace CommonTypes {
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
		| 'image/webp'

	export type Video = 'video/mpeg' | 'video/x-msvideo' | 'video/ogg' | 'video/webm'

	export type Audio =
		| 'audio/mpeg'
		| 'audio/wav'
		| 'audio/aac'
		| 'audio/midi'
		| 'audio/x-midi'
		| 'audio/ogg'
		| 'audio/webm'
}

/**
 * @public
 */
export type NonErrorStatusCode =
	| NonErrorStatusCode.Information
	| NonErrorStatusCode.Redirection
	| NonErrorStatusCode.Success

export namespace NonErrorStatusCode {
	export type Information = 100 | 101 | 102 | 103
	export type Success = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
	export type Redirection = 300 | 301 | 302 | 303 | 304 | 307 | 308
}

/**
 * Remove methods sending the response.
 * @public
 */
export interface ResponseSafe
	extends Omit<
		express.Response,
		| 'send'
		| 'json'
		| 'jsonp'
		| 'render'
		| 'sendStatus'
		| 'sendFile'
		| 'sendfile'
		| 'download'
		| 'format'
		| 'redirect'
		| 'write'
		| 'end'
		| 'writeContinue'
		| 'writeHead'
		| 'writeProcessing'
		| 'flushHeaders'
		| 'destroy'
		| 'cork'
		| 'uncork'
		| 'assignSocket'
		| 'detachSocket'
		| '_destroy'
		| '_final'
		| '_write'
		| '_writev'
	> {}

/**
 * Remove methods sending the response or modifying its headers.
 * @public
 */
export interface ResponseReadonly
	extends Omit<
		ResponseSafe,
		| 'status'
		| 'set'
		| 'header'
		| 'append'
		| 'type'
		| 'contentType'
		| 'location'
		| 'links'
		| 'vary'
		| 'cookie'
		| 'clearCookie'
		| 'attachment'
		| 'addTrailers'
		| 'removeHeader'
		| 'setHeader'
		| 'setTimeout'
		| 'setDefaultEncoding'
	> {}
