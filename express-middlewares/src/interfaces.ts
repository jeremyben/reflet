import { Response } from 'express'

/**
 * @public
 */
export type ClassOrMethodDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * Remove methods sending the response.
 * @public
 */
export type ResponseSafe = Omit<
	Response,
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
>

/**
 * Remove methods sending the response or modifying its headers.
 * @public
 */
export type ResponseReadonly = Omit<
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
>
