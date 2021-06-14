import * as express from 'express'
import { isAsyncFunction } from './type-guards'

/**
 * @internal
 */
export function wrapAsync(handler: express.RequestHandler) {
	if (isAsyncFunction<express.RequestHandler>(handler)) {
		return (req: express.Request, res: express.Response, next: express.NextFunction) => {
			return handler(req, res, next).catch(next)
		}
	}

	return handler
}

/**
 * @internal
 */
export function wrapAsyncError(handler: express.ErrorRequestHandler) {
	if (isAsyncFunction<express.ErrorRequestHandler>(handler)) {
		return (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
			return handler(error, req, res, next).catch(next)
		}
	}

	return handler
}
