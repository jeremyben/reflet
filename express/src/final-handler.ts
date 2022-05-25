import * as express from 'express'

/**
 * Final error handler to apply globally on the app, to be able to send errors as `json`.
 *
 * @example
 * ```ts
 * app.use(finalHandler({
 *   sendAsJson: true,
 *   exposeInJson: ['name', 'message'],
 *   log: '5xx',
 *   notFoundHandler: true,
 * }))
 * ```
 * ------
 * @public
 */
export function finalHandler(options: finalHandler.Options): express.ErrorRequestHandler {
	const finalErrorHandler: express.ErrorRequestHandler = (error, req, res, next) => {
		if (res.headersSent) {
			return next(error)
		}

		// ─── Status ───

		const errorStatus = getStatusFromErrorProps(error)

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

		if (!!error && !!error.headers && typeof error.headers === 'object') {
			res.set(error.headers)
		}

		// ─── Log ───

		if (options.log) {
			const logger = options.logger || ((err) => setImmediate(() => console.error(err)))

			if (options.log === true || (options.log === '5xx' && res.statusCode >= 500)) {
				logger(error)
			}

			// no need to handle false
		}

		// ─── Json ───

		if (options.sendAsJson === true) {
			return res.json(marshalError(error, res, options.exposeInJson))
		} else if (options.sendAsJson === 'from-response-type') {
			const responseType = res.get('Content-Type')
			// https://regex101.com/r/noMxut/1
			const jsonInferredFromResponse = /^application\/(\S+\+|)json/m.test(responseType)

			if (jsonInferredFromResponse) {
				return res.json(marshalError(error, res, options.exposeInJson))
			}
		} else if (options.sendAsJson === 'from-response-type-or-request') {
			const responseType = res.get('Content-Type')
			const jsonInferredFromResponse = /^application\/(\S+\+|)json/m.test(responseType)
			const jsonInferredFromRequest = !responseType && (req.xhr || (!!req.get('Accept') && !!req.accepts('json')))

			if (jsonInferredFromResponse || jsonInferredFromRequest) {
				return res.json(marshalError(error, res, options.exposeInJson))
			}
		}

		// no need to handle false

		next(error)
	}

	if (!options.notFoundHandler) {
		return finalErrorHandler
	}

	const notFoundStatus = typeof options.notFoundHandler === 'number' ? options.notFoundHandler : 404

	// https://github.com/pillarjs/finalhandler/blob/v1.1.2/index.js#L113-L115
	const notFoundHandlerr: express.RequestHandler =
		typeof options.notFoundHandler === 'function'
			? options.notFoundHandler
			: function notFoundHandler(req: express.Request, res: express.Response, next: express.NextFunction) {
					res.status(notFoundStatus)
					const notFoundError = new RouteNotFoundError(`Cannot ${req.method} ${req.baseUrl}${req.path}`)
					next(notFoundError)
			  }

	return [notFoundHandlerr, finalErrorHandler] as any
}

export namespace finalHandler {
	/**
	 * @public
	 */
	export interface Options {
		/**
		 * Specifies behavior to use `res.json` to send errors:
		 *
		 * - `true`: always send as json.
		 * - `false`: pass directly the error to `next`.
		 * - `'from-response-type'`: looks for a json compatible `Content-Type` on the response (or else pass to `next`)
		 * - `'from-response-type-or-request'`: if the response doesn't have a `Content-type` header, it looks for  `X-Requested-With` or `Accept` headers on the request (or else pass to `next`)
		 */
		sendAsJson: boolean | 'from-response-type' | 'from-response-type-or-request'

		/**
		 * Exposes error properties in serialized json:
		 *
		 * - `true`: exposes all properties (stack included, beware of information leakage !), _default in development_.
		 * - `false`: exposes nothing (empty object), _default in production_.
		 * - array of strings: whitelists specifics properties.
		 *
		 * You can pass a function with the status code as parameter for more conditional whitelisting.
		 *
		 * @default
		 * false // in production (NODE_ENV === 'production')
		 * true // in other environments
		 *
		 * @remark
		 * Only applied when the error is sent as json.
		 */
		exposeInJson?: boolean | ErrorProps[] | ((statusCode: number) => boolean | ErrorProps[])

		/**
		 * log error:
		 *
		 * - `true`: every error
		 * - `false`: none
		 * - `'5xx'`: only server errors
		 */
		log?: boolean | '5xx'

		/**
		 * Custom logger
		 * @default console.error
		 */
		logger?: (err: any) => any

		/**
		 * Defines the handler when the route is not found:
		 *
		 * - switch to `true` to apply a basic handler throwing a `404` error.
		 * - switch to a number to apply the same basic handler with a custom status code.
		 * - or declare your own handler.
		 */
		notFoundHandler?: boolean | number | express.RequestHandler
	}
}

/**
 * @public
 */
// https://github.com/microsoft/TypeScript/issues/29729
type ErrorProps = 'name' | 'message' | 'stack' | (string & Record<never, never>)

/**
 * @internal
 */
class RouteNotFoundError extends Error {
	constructor(message: string) {
		super(message)
		// Must assign the name this way:
		Object.defineProperty(this, 'name', { value: 'RouteNotFoundError', configurable: true })
		Error.captureStackTrace(this, RouteNotFoundError)
	}

	// The dev user doesn't need a stack trace for this error.
	toString() {
		return `${this.name}: ${this.message}`
	}
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

/**
 * @internal
 */
function marshalError(err: any, res: express.Response, exposeProps: finalHandler.Options['exposeInJson']) {
	if (!err || typeof err !== 'object') {
		return err
	}

	const props =
		exposeProps === undefined
			? process.env.NODE_ENV !== 'production'
			: typeof exposeProps === 'function'
			? exposeProps(res.statusCode)
			: exposeProps

	if (props === true) {
		const obj = { ...err }

		// Copy non-enumerable properties
		if ('message' in err) obj.message = err.message
		if ('name' in err) obj.name = err.name
		if ('stack' in err) obj.stack = err.stack

		return obj
	} else if (props === false) {
		return {}
	} else if (Array.isArray(props)) {
		const obj: Record<string, any> = {}

		for (const prop of props) {
			if (prop in err) {
				obj[prop] = err[prop]
			}
		}

		return obj
	} else {
		return err
	}
}
