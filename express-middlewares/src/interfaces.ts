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
