import * as express from 'express'
import { ResponseReadonly } from './interfaces'

/**
 * Final error handler to apply globally on the app, to be able to send errors as `json`.
 *
 * @example
 * ```ts
 * app.use(finalHandler({
 *   json: true,
 *   expose: ['name', 'message'],
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
			if (typeof options.log === 'function') {
				options.log(error, req, res)
			} else if (options.log === true || (options.log === '5xx' && res.statusCode >= 500)) {
				setImmediate(() => console.error(error))
			}
		}

		// ─── Expose ───

		const marshalledError = marshalError(error, res, options.expose)

		// ─── Json ───

		if (options.json === true) {
			return res.json(marshalledError)
		} else if (options.json === 'from-response-type') {
			const responseType = res.get('Content-Type')
			// https://regex101.com/r/noMxut/1
			const jsonInferredFromResponse = /^application\/(\S+\+|)json/m.test(responseType)

			if (jsonInferredFromResponse) {
				return res.json(marshalledError)
			}
		} else if (options.json === 'from-response-type-or-request') {
			const responseType = res.get('Content-Type')
			const jsonInferredFromResponse = /^application\/(\S+\+|)json/m.test(responseType)
			const jsonInferredFromRequest = !responseType && (req.xhr || (!!req.get('Accept') && !!req.accepts('json')))

			if (jsonInferredFromResponse || jsonInferredFromRequest) {
				return res.json(marshalledError)
			}
		}

		// ─── Html ───

		next(marshalledError)
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
		json: boolean | 'from-response-type' | 'from-response-type-or-request'

		/**
		 * Exposes error properties to client:
		 *
		 * - `true`: exposes all properties (stack included, beware of information leakage !).
		 * - `false`: exposes nothing (empty object).
		 * - `string[]`: whitelists specific error properties.
		 * - `(status) => boolean | string[]`: flexible whitelisting.
		 *
		 * You can pass a function with the status code as parameter for more conditional whitelisting.
		 */
		expose: boolean | finalHandler.ErrorProps[] | finalHandler.Exposer

		/**
		 * log error:
		 *
		 * - `true`: every error
		 * - `false`: none
		 * - `'5xx'`: only server errors
		 * - `(err, req, res) => void`: flexible logging
		 */
		log?: boolean | '5xx' | finalHandler.Logger

		/**
		 * Defines the handler when the route is not found:
		 *
		 * - switch to `true` to apply a basic handler throwing a `404` error.
		 * - switch to a number to apply the same basic handler with a custom status code.
		 * - or declare your own handler.
		 */
		notFoundHandler?: boolean | number | express.RequestHandler
	}

	/**
	 * @public
	 */
	export type Exposer = (statusCode: number) => boolean | finalHandler.ErrorProps[]

	/**
	 * @public
	 */
	export type Logger = (err: any, req: express.Request, readonlyRes: ResponseReadonly) => void

	/**
	 * @public
	 */
	// https://github.com/microsoft/TypeScript/issues/29729
	export type ErrorProps = 'name' | 'message' | 'stack' | (string & Record<never, never>)
}

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
function marshalError(err: any, res: express.Response, expose: finalHandler.Options['expose']) {
	if (!err || typeof err !== 'object') {
		return err
	}

	const exposeProps = typeof expose === 'function' ? expose(res.statusCode) : expose

	if (exposeProps === true) {
		const obj = { ...err }

		// Copy non-enumerable error properties
		if ('message' in err) obj.message = err.message
		if ('name' in err) obj.name = err.name
		if ('stack' in err) obj.stack = err.stack
		if ('cause' in err) obj.cause = err.cause

		// Copy serializing methods
		if ('toString' in err) {
			Object.defineProperty(obj, 'toString', { value: err.toString, enumerable: false })
		}
		if ('toJSON' in err) {
			Object.defineProperty(obj, 'toJSON', { value: err.toJSON, enumerable: false })
		}

		return obj
	} else if (Array.isArray(exposeProps)) {
		const obj: Record<string, any> = {}

		for (const prop of exposeProps) {
			if (prop in err) {
				obj[prop] = err[prop]
			}
		}

		// Copy serializing methods as well
		if ('toString' in err) {
			Object.defineProperty(obj, 'toString', { value: err.toString, enumerable: false })
		}
		if ('toJSON' in err) {
			Object.defineProperty(obj, 'toJSON', { value: err.toJSON, enumerable: false })
		}

		return obj
	} else {
		// avoid [Object object] when serializing to html
		const obj = Object.create({ toString: () => '' })

		return obj
	}
}
