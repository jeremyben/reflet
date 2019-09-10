import { Request, Response, NextFunction, Application, RequestHandlerParams, PathParams } from 'express'
import { isErrorHandlerParams, isPathParams } from './utils'
import { Fn } from './interfaces'

/**
 * Adds json response detection and status code detection to express default error handler.
 * Can be overwritten by another custom global error handler.
 *
 * @see http://expressjs.com/en/guide/error-handling.html#writing-error-handlers
 * @internal
 */
export function defaultErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	// https://regex101.com/r/oBuEQY/4
	const definitelyJson = /(.*[^\w\s]|^)json(; ?charset.*)?$/m.test(res.get('Content-Type'))
	const probablyJson =
		!res.get('Content-Type') && (req.xhr || (!!req.get('Accept') && !!req.accepts('json')))

	const status = getErrorStatus(err, res)
	res.status(status)

	if (!res.headersSent && (definitelyJson || probablyJson)) {
		if (err instanceof Error) {
			// Make `message` property visible in the response https://stackoverflow.com/questions/18391212
			Object.defineProperty(err, 'message', { enumerable: true })
			// Remove sensitive info in production environment
			if (process.env.NODE_ENV === 'production') delete err.stack
		}

		res.json(err)
	} else {
		next(err)
	}
}

/**
 * Infer status code from all types of error.
 * @internal
 */
function getErrorStatus(err: any, res: Response): number {
	switch (typeof err) {
		case 'number':
		case 'string':
			return parse(err)

		case 'object':
			// Look for the status in a similar priority order than express finalhandler
			// https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L99-L104
			return parse(err.status || err.statusCode || err.message || res.statusCode)

		default:
			return parse(res.statusCode)
	}

	function parse(value: string | number): number {
		const code = Number.parseInt(value as string, 10)
		if (Number.isNaN(code) || code < 400 || code > 599) return 500
		return code
	}
}

// Unique name of default error handler to retrieve it later from `app._router.stack`.
const defaultErrorHandlerName = '@reflet/express.defaultErrorHandler' as string
Object.defineProperty(defaultErrorHandler, 'name', { value: defaultErrorHandlerName })

/**
 * Patch `app.use` to allow developpers redefining their own global error handler.
 * @internal
 */
export function makeErrorHandlerRemovable(app: Application): void {
	// https://expressjs.com/en/4x/api.html#middleware-callback-function-examples
	const use0 = app.use as Fn

	app.use = (first: RequestHandlerParams | PathParams, ...others: RequestHandlerParams[]) => {
		if (isErrorHandlerParams(first) || (!isPathParams(first) && others.some(isErrorHandlerParams))) {
			// patch back to original implementation
			app.use = use0
			// remove our default error handler from the stack
			const index = app._router.stack.findIndex((layer) => layer.name === defaultErrorHandlerName)
			if (index !== -1) app._router.stack.splice(index, 1)
		}

		return use0.call(app, first, ...others)
	}
}

/**
 * @internal
 */
export function hasDefaultErrorHandler(app: Application): boolean {
	return app._router.stack.some((layer) => layer.name === defaultErrorHandlerName)
}
