import * as express from 'express'
import * as core from 'express-serve-static-core'
import { isErrorHandlerParams, isPathParams } from './type-guards'

/**
 * Adds json response detection and status code detection to express default error handler.
 * Can be overwritten by another custom global error handler.
 *
 * @see http://expressjs.com/en/guide/error-handling.html#writing-error-handlers
 * @internal
 */
export function globalErrorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
	// ─── Status detection ───

	let status = StatusParser.getFromError(err)

	if (status) {
		// Normalize only if it was correctly parsed from error.
		err = StatusParser.normalize(err, status)
	} else {
		// Error has no recognizable error status.
		status = StatusParser.getFromResponse(res)
	}

	if (status >= 500) {
		console.error(err)
	}

	res.status(status)

	// ─── Json detection ───

	const responseType = res.get('Content-Type')

	// https://regex101.com/r/oBuEQY/4
	const definitelyJson = /(.*[^\w\s]|^)json(; ?charset.*)?$/m.test(responseType)
	const probablyJson = !responseType && (req.xhr || (!!req.get('Accept') && !!req.accepts('json')))

	if (!res.headersSent && (definitelyJson || probablyJson)) {
		if (err instanceof Error) {
			// Make `message` property visible in the response https://stackoverflow.com/questions/18391212
			Object.defineProperty(err, 'message', { enumerable: true })

			/* istanbul ignore if */
			// Remove sensitive info in production environment
			if (process.env.NODE_ENV === 'production') delete err.stack
		}

		res.json(err)
	} else {
		next(err)
	}
}

// Unique name of global error handler to retrieve it later from `app._router.stack`.
const globalErrorHandlerName = '@reflet/express.globalErrorHandler' as string
Object.defineProperty(globalErrorHandler, 'name', { value: globalErrorHandlerName })

/**
 * Patch `app.use` to detect new global error handler and remove ours.
 * @internal
 */
export function makeGlobalErrorHandlerRemovable(app: express.Application): void {
	// https://expressjs.com/en/4x/api.html#middleware-callback-function-examples
	const use0 = app.use

	app.use = function use(first: core.RequestHandlerParams | core.PathParams, ...others: core.RequestHandlerParams[]) {
		if (isErrorHandlerParams(first) || (!isPathParams(first) && others.some(isErrorHandlerParams))) {
			// patch back to original implementation
			app.use = use0

			// remove our default error handler from the stack
			const index = app._router.stack.findIndex((layer) => layer.name === globalErrorHandlerName)
			if (index !== -1) {
				app._router.stack.splice(index, 1)
			}
		}

		return use0.apply(app, (arguments as unknown) as Parameters<express.Application['use']>)
	}
}

/**
 * For testing purposes.
 * @internal
 */
export function hasGlobalErrorHandler(app: express.Application): boolean {
	return app._router.stack.some((layer) => layer.name === globalErrorHandlerName)
}

/**
 * Infer status code from all types of error.
 * Look for the status in a similar priority order than express finalhandler.
 * @see https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L99-L104
 * @internal
 */
namespace StatusParser {
	/**
	 * Try to get status code from error.
	 * @see https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L195
	 * @internal
	 */
	export function getFromError(err: any): number | undefined {
		const code = extractCode(err)

		if (!code || Number.isNaN(code) || code < 400 || code > 599) return undefined
		else return code
	}

	/**
	 * Retrieve code number.
	 * @internal
	 */
	function extractCode(err: any): number | undefined {
		if (!err) return undefined

		switch (typeof err) {
			case 'number':
				return err

			case 'string':
				return Number.parseInt(err, 10)

			// Parse both object litteral and Error instance.
			case 'object':
				return extractCode(err.status) || extractCode(err.statusCode) || extractCode(err.message)

			/* istanbul ignore next - don't care about any other type */
			default:
				return undefined
		}
	}

	/**
	 * Get status code from response.
	 * @see https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L236
	 * @internal
	 */
	export function getFromResponse(res: express.Response): number {
		if (typeof res.statusCode !== 'number' || res.statusCode < 400 || res.statusCode > 599) {
			return 500
		}
		return res.statusCode
	}

	/**
	 * Normalize primitive types to objects.
	 * Remove eventual status code from message.
	 * @internal
	 */
	export function normalize(err: any, status: number) {
		const errorStatusAtStart = new RegExp(`^${status}(?!\\d)\\W?\\s*`, 'm') // https://regex101.com/r/7rGUsp/3

		// Only normalize errors without status property.
		if (!!err && typeof err === 'object' && err.message && !err.status && !err.statusCode) {
			err.status = status
			err.message = err.message.replace(errorStatusAtStart, '')
			return err
		} else if (typeof err === 'string') {
			return { status, message: err.replace(errorStatusAtStart, '') }
		} else if (typeof err === 'number') {
			// We must return a truthy value for express final handler to work as expected
			// https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L98
			return { status, message: '' }
		} else {
			return err
		}
	}
}
