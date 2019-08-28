import { RequestHandler, ErrorRequestHandler, Request, Response, NextFunction } from 'express'

/**
 * @internal
 */
export function promisifyHandler(handler: RequestHandler) {
	return (req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(handler(req, res, next)).catch(next)
}

/**
 * @internal
 */
export function promisifyErrorHandler(handler: ErrorRequestHandler) {
	return (error: any, req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(handler(error, req, res, next)).catch(next)
}
