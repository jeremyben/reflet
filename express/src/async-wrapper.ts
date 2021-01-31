import * as express from 'express'

/**
 * @internal
 */
export function promisifyHandler(handler: express.RequestHandler) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) =>
		Promise.resolve(handler(req, res, next)).catch(next)
}

/**
 * @internal
 */
export function promisifyErrorHandler(handler: express.ErrorRequestHandler) {
	return (error: any, req: express.Request, res: express.Response, next: express.NextFunction) =>
		Promise.resolve(handler(error, req, res, next)).catch(next)
}
