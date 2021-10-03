import * as express from 'express'

/**
 * Final error handler to apply globally on the app, to be able to send errors as `json`.
 *
 * @example
 * ```ts
 * app.use(finalHandler({
 *   sendAsJson: 'always',
 *   log: '5xx',
 *   revealErrorMessage: true,
 *   revealErrorName: true,
 *   cleanStatusAndHeaders: true,
 *   notFoundHandler: true,
 * }))
 * ```
 * ------
 * @public
 */
export function finalHandler(options: FinalHandlerOptions): express.ErrorRequestHandler {
	const finalErrorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
		if (res.headersSent) {
			return next(err)
		}

		// ─── Status ───

		const errorStatus = getStatusFromErrorProps(err)

		if (errorStatus) {
			res.status(errorStatus)
		} else if (
			typeof res.statusCode !== 'number' ||
			res.statusCode < 400 ||
			res.statusCode > 599 ||
			Number.isNaN(res.statusCode)
		) {
			res.status(500)
		}

		// ─── Headers ───

		if (!!err && !!err.headers && typeof err.headers === 'object') {
			res.set(err.headers)
		}

		// ─── Clean ───

		if (options.cleanStatusAndHeaders && !!err && typeof err === 'object') {
			if (err.status) delete err.status
			if (err.statusCode) delete err.statusCode
			if (err.headers) delete err.headers
		}

		// ─── Reveal ───

		if (err instanceof Error) {
			if (options.revealErrorMessage) {
				Object.defineProperty(err, 'message', { enumerable: true })
			}

			if (options.revealErrorName) {
				// Doesn't work without reassigning value.
				Object.defineProperty(err, 'name', { enumerable: true, value: err.name })
			}
		}

		// ─── Log ───

		if (options.log) {
			const logger = options.logger || ((errr) => setImmediate(() => console.error(errr)))

			if (options.log === 'always' || (options.log === '5xx' && res.statusCode >= 500)) {
				logger(err)
			}

			// no need to handle 'never'
		}

		// ─── Json ───

		if (options.sendAsJson === 'always') {
			return res.json(err)
		}

		if (options.sendAsJson === 'from-response-type') {
			const responseType = res.get('Content-Type')
			// https://regex101.com/r/oBuEQY/4
			const definitelyJson = /(.*[^\w\s]|^)json(; ?charset.*)?$/m.test(responseType)

			if (definitelyJson) {
				return res.json(err)
			}
		}

		if (options.sendAsJson === 'from-response-type-or-request') {
			const responseType = res.get('Content-Type')
			const definitelyJson = /(.*[^\w\s]|^)json(; ?charset.*)?$/m.test(responseType)
			const probablyJson = !responseType && (req.xhr || (!!req.get('Accept') && !!req.accepts('json')))

			if (definitelyJson || probablyJson) {
				return res.json(err)
			}
		}

		// no need to handle 'never'

		next(err)
	}

	if (!options.notFoundHandler) {
		return finalErrorHandler
	}

	const notFoundHandler: express.RequestHandler =
		typeof options.notFoundHandler === 'function' ? options.notFoundHandler : notFoundHandlerDefault

	return [notFoundHandler, finalErrorHandler] as any
}

/**
 * @public
 */
export interface FinalHandlerOptions {
	/**
	 * Specifies behavior to use `res.json` to send errors:
	 * - `'always'`: always send as json.
	 * - `'never'`: pass the error to `next`.
	 * - `'from-response-type'`: looks for a json compatible `Content-Type` on the response (or else pass to `next`)
	 * - `'from-response-type-or-request'`: if the response doesn't have a `Content-type` header, it looks for  `X-Requested-With` or `Accept` headers on the request (or else pass to `next`)
	 */
	sendAsJson: 'always' | 'never' | 'from-response-type' | 'from-response-type-or-request'

	/**
	 * log error:
	 * - `'always'`: every error
	 * - `'never'`: none
	 * - `'5xx'`: only server errors
	 */
	log?: 'always' | 'never' | '5xx'

	/**
	 * Custom logger
	 * @default console.error
	 */
	logger?: (err: any) => any

	/**
	 * Make error `message` enumerable so it can be serialized.
	 */
	revealErrorMessage?: boolean

	/**
	 * Make error `name` enumerable so it can be serialized.
	 */
	revealErrorName?: boolean

	/**
	 * Remove `status`, `statusCode` or `headers` properties from error object, once they are applied to the response.
	 */
	cleanStatusAndHeaders?: boolean

	/**
	 * Defines the handler when the route is not found:
	 *
	 * - switch to `true` to apply a basic handler throwing a `404` error
	 * - or declare your own handler
	 */
	notFoundHandler?: boolean | express.RequestHandler
}

/**
 * @see https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L113-L115
 * @internal
 */
function notFoundHandlerDefault(req: express.Request, res: express.Response, next: express.NextFunction) {
	res.status(404)
	const notFoundError = Error(`Cannot ${req.method} ${req.baseUrl}${req.path}`)
	next(notFoundError)
}

/**
 * @see https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L195-L207
 * @internal
 */
function getStatusFromErrorProps(err: any): number | undefined {
	if (!err || typeof err !== 'object') {
		return undefined
	}

	if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
		return err.status
	}

	if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
		return err.statusCode
	}

	return undefined
}
