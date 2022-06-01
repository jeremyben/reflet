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
 * Only readonly properties and methods from response.
 * @public
 */
export type ResponseReadonly = Pick<
	express.Response,
	| 'statusCode'
	| 'statusMessage'
	| 'locals'
	| 'charset'
	| 'headersSent'
	| 'getHeader'
	| 'getHeaders'
	| 'getHeaderNames'
	| 'hasHeader'
	| 'finished'
	| 'writableEnded'
	| 'writableFinished'
>
