/**
 * @public
 */
const OriginalErrors = <const>{
	// Client errors
	400: 'BadRequest',
	401: 'Unauthorized',
	402: 'PaymentRequired',
	403: 'Forbidden',
	404: 'NotFound',
	405: 'MethodNotAllowed',
	406: 'NotAcceptable',
	407: 'ProxyAuthenticationRequired',
	408: 'RequestTimeout',
	409: 'Conflict',
	410: 'Gone',
	411: 'LengthRequired',
	412: 'PreconditionFailed',
	413: 'PayloadTooLarge',
	414: 'URITooLong',
	415: 'UnsupportedMediaType',
	416: 'RequestedRangeNotSatisfiable',
	417: 'ExpectationFailed',
	418: 'ImATeapot',
	421: 'MisdirectedRequest',
	422: 'UnprocessableEntity',
	423: 'Locked',
	424: 'FailedDependency',
	425: 'UnorderedCollection',
	426: 'UpgradeRequired',
	428: 'PreconditionRequired',
	429: 'TooManyRequests',
	431: 'RequestHeaderFieldsTooLarge',
	451: 'UnavailableForLegalReasons',

	// Server errors
	500: 'InternalServerError',
	501: 'NotImplemented',
	502: 'BadGateway',
	503: 'ServiceUnavailable',
	504: 'GatewayTimeout',
	505: 'HTTPVersionNotSupported',
	506: 'VariantAlsoNegotiates',
	507: 'InsufficientStorage',
	508: 'LoopDetected',
	510: 'NotExtended',
	511: 'NetworkAuthenticationRequired',
}

type OriginalErrors = typeof OriginalErrors

/**
 * @public
 */
const protectedProperties = ['__proto__', 'constructor', 'prototype', 'name', 'status', 'stack']

/**
 * HTTP centric error inherited from the native Error constructor.
 * @public
 */
class HttpError<S extends _HttpError.Status> extends Error {
	/**
	 * HTTP status code.
	 */
	readonly status: S

	/**
	 * Name inferred from status code.
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1.1
	 */
	readonly name: S extends keyof OriginalErrors
		? OriginalErrors[S]
		: S extends keyof RefletHttp.CustomErrors
		? RefletHttp.CustomErrors[S]
		: 'HttpError'

	constructor(
		// Only way to make an argument either required or optional without overloading (which does not work properly without `new` keyword)
		...args: keyof RefletHttp.ErrorParams[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.ErrorParams[S]]
	) {
		super(typeof args[1] === 'string' ? args[1] : '')

		this.name = (<any>OriginalErrors)[args[0]] || this.constructor.name
		Object.defineProperty(this, 'name', { enumerable: false }) // keep the original configuration of Error.

		this.status = args[0]

		// Assign properties directly to the error object if the interface was augmented.
		if (typeof args[1] === 'object' && !!args[1]) {
			const data: Record<string, any> = args[1]

			for (const key in data) {
				if (!Object.prototype.hasOwnProperty.call(data, key)) continue

				// Prevent prototype pollution or overwriting important properties.
				if (protectedProperties.includes(key)) {
					console.warn(
						`RefletHttpWarning: [HttpError] "${key}" from params of the ${this.status} error is a protected property and cannot be applied.`
					)
					continue
				}

				if (key === 'message') {
					// Always cast message to string.
					const message: string =
						typeof data[key] === 'string' ? data[key] : data[key] != null ? JSON.stringify(data[key]) : ''

					super.message = message // attach to parent to keep message non-enumerable.
				} else {
					this[<keyof this>key] = data[key]
				}
			}
		}

		// Remove constructor call from stack trace.
		// https://v8.dev/docs/stack-trace-api#stack-trace-collection-for-custom-exceptions
		// Use the hidden third argument to get or not the right caller.
		const constructorOpt =
			(<any>args)[2] === Caller.Direct
				? HttpError[<'BadRequest'>this.name] || HttpError
				: (<any>args)[2] === Caller.Proxy
				? proxyHandler.apply
				: HttpError

		// Handle custom stackTraceLimit for HttpError
		if (HttpError.stackTraceLimit !== Error.stackTraceLimit) {
			const stackTraceLimit = Error.stackTraceLimit
			Error.stackTraceLimit = HttpError.stackTraceLimit

			Error.captureStackTrace(this, constructorOpt)

			Error.stackTraceLimit = stackTraceLimit
		} else {
			Error.captureStackTrace(this, constructorOpt)
		}
	}

	/**
	 * Type guard to ensure the error object is an instance of HttpError and has specific status.
	 */
	static isInstance<S extends _HttpError.Status>(err: unknown, status?: S | S[]): err is _HttpError<S> {
		if (status == null) {
			return err instanceof HttpError
		}

		if (Array.isArray(status)) {
			return err instanceof HttpError && status.some((s) => err.status === s)
		}

		return err instanceof HttpError && err.status === status
	}

	/**
	 * Retrieves error status code from generic objects if any has one between 400 and 599.
	 * Looks for `status` or `statusCode` property.
	 *
	 * Useful to get status code from either error object or response object:
	 * ```ts
	 * const statusCode = HttpError.getStatus(err, res) || 500
	 * ```
	 */
	static getStatus(...objs: unknown[]): number | undefined {
		for (const obj of objs as any[]) {
			if (!obj || typeof obj !== 'object') {
				continue
			}

			if (typeof obj.status === 'number' && obj.status >= 400 && obj.status < 600) {
				return obj.status
			}

			if (typeof obj.statusCode === 'number' && obj.statusCode >= 400 && obj.statusCode < 600) {
				return obj.statusCode
			}
		}

		return undefined
	}

	// static [Symbol.hasInstance](obj: any) {
	// 	if (obj instanceof Error && obj.hasOwnProperty('status') && typeof (obj as any).status === 'number') {
	// 		return true
	// 	}
	// 	return false
	// }

	/**
	 * `400`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
	 */
	// @ts-ignore
	static BadRequest(...args: ErrParams<400>): _HttpError<400> {
		const error = new (HttpError as any)(400, args[0], Caller.Direct)
		return error
	}

	/**
	 * `401`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
	 */
	// @ts-ignore
	static Unauthorized(...args: ErrParams<401>): _HttpError<401> {
		const error = new (HttpError as any)(401, args[0], Caller.Direct)
		return error
	}

	/**
	 * `402`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
	 */
	// @ts-ignore
	static PaymentRequired(...args: ErrParams<402>): _HttpError<402> {
		const error = new (HttpError as any)(402, args[0], Caller.Direct)
		return error
	}

	/**
	 * `403`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
	 */
	// @ts-ignore
	static Forbidden(...args: ErrParams<403>): _HttpError<403> {
		const error = new (HttpError as any)(403, args[0], Caller.Direct)
		return error
	}

	/**
	 * `404`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
	 */
	// @ts-ignore
	static NotFound(...args: ErrParams<404>): _HttpError<404> {
		const error = new (HttpError as any)(404, args[0], Caller.Direct)
		return error
	}

	/**
	 * `405`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
	 */
	// @ts-ignore
	static MethodNotAllowed(...args: ErrParams<405>): _HttpError<405> {
		const error = new (HttpError as any)(405, args[0], Caller.Direct)
		return error
	}

	/**
	 * `406`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
	 */
	// @ts-ignore
	static NotAcceptable(...args: ErrParams<406>): _HttpError<406> {
		const error = new (HttpError as any)(406, args[0], Caller.Direct)
		return error
	}

	/**
	 * `407`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407
	 */
	// @ts-ignore
	static ProxyAuthenticationRequired(...args: ErrParams<407>): _HttpError<407> {
		const error = new (HttpError as any)(407, args[0], Caller.Direct)
		return error
	}

	/**
	 * `408`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408
	 */
	// @ts-ignore
	static RequestTimeout(...args: ErrParams<408>): _HttpError<408> {
		const error = new (HttpError as any)(408, args[0], Caller.Direct)
		return error
	}

	/**
	 * `409`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
	 */
	// @ts-ignore
	static Conflict(...args: ErrParams<409>): _HttpError<409> {
		const error = new (HttpError as any)(409, args[0], Caller.Direct)
		return error
	}

	/**
	 * `410`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
	 */
	// @ts-ignore
	static Gone(...args: ErrParams<410>): _HttpError<410> {
		const error = new (HttpError as any)(410, args[0], Caller.Direct)
		return error
	}

	/**
	 * `411`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411
	 */
	// @ts-ignore
	static LengthRequired(...args: ErrParams<411>): _HttpError<411> {
		const error = new (HttpError as any)(411, args[0], Caller.Direct)
		return error
	}

	/**
	 * `412`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412
	 */
	// @ts-ignore
	static PreconditionFailed(...args: ErrParams<412>): _HttpError<412> {
		const error = new (HttpError as any)(412, args[0], Caller.Direct)
		return error
	}

	/**
	 * `413`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
	 */
	// @ts-ignore
	static PayloadTooLarge(...args: ErrParams<413>): _HttpError<413> {
		const error = new (HttpError as any)(413, args[0], Caller.Direct)
		return error
	}

	/**
	 * `414`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414
	 */
	// @ts-ignore
	static URITooLong(...args: ErrParams<414>): _HttpError<414> {
		const error = new (HttpError as any)(414, args[0], Caller.Direct)
		return error
	}

	/**
	 * `415`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
	 */
	// @ts-ignore
	static UnsupportedMediaType(...args: ErrParams<415>): _HttpError<415> {
		const error = new (HttpError as any)(415, args[0], Caller.Direct)
		return error
	}

	/**
	 * `416`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
	 */
	// @ts-ignore
	static RequestedRangeNotSatisfiable(...args: ErrParams<416>): _HttpError<416> {
		const error = new (HttpError as any)(416, args[0], Caller.Direct)
		return error
	}

	/**
	 * `417`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417
	 */
	// @ts-ignore
	static ExpectationFailed(...args: ErrParams<417>): _HttpError<417> {
		const error = new (HttpError as any)(417, args[0], Caller.Direct)
		return error
	}

	/**
	 * `418`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
	 */
	// @ts-ignore
	static ImATeapot(...args: ErrParams<418>): _HttpError<418> {
		const error = new (HttpError as any)(418, args[0], Caller.Direct)
		return error
	}

	/**
	 * `421`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421
	 */
	// @ts-ignore
	static MisdirectedRequest(...args: ErrParams<421>): _HttpError<421> {
		const error = new (HttpError as any)(421, args[0], Caller.Direct)
		return error
	}

	/**
	 * `422`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
	 */
	// @ts-ignore
	static UnprocessableEntity(...args: ErrParams<422>): _HttpError<422> {
		const error = new (HttpError as any)(422, args[0], Caller.Direct)
		return error
	}

	/**
	 * `423`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423
	 */
	// @ts-ignore
	static Locked(...args: ErrParams<423>): _HttpError<423> {
		const error = new (HttpError as any)(423, args[0], Caller.Direct)
		return error
	}

	/**
	 * `424`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424
	 */
	// @ts-ignore
	static FailedDependency(...args: ErrParams<424>): _HttpError<424> {
		const error = new (HttpError as any)(424, args[0], Caller.Direct)
		return error
	}

	/**
	 * `425`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425
	 */
	// @ts-ignore
	static UnorderedCollection(...args: ErrParams<425>): _HttpError<425> {
		const error = new (HttpError as any)(425, args[0], Caller.Direct)
		return error
	}

	/**
	 * `426`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426
	 */
	// @ts-ignore
	static UpgradeRequired(...args: ErrParams<426>): _HttpError<426> {
		const error = new (HttpError as any)(426, args[0], Caller.Direct)
		return error
	}

	/**
	 * `428`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428
	 */
	// @ts-ignore
	static PreconditionRequired(...args: ErrParams<428>): _HttpError<428> {
		const error = new (HttpError as any)(428, args[0], Caller.Direct)
		return error
	}

	/**
	 * `429`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
	 */
	// @ts-ignore
	static TooManyRequests(...args: ErrParams<429>): _HttpError<429> {
		const error = new (HttpError as any)(429, args[0], Caller.Direct)
		return error
	}

	/**
	 * `431`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431
	 */
	// @ts-ignore
	static RequestHeaderFieldsTooLarge(...args: ErrParams<431>): _HttpError<431> {
		const error = new (HttpError as any)(431, args[0], Caller.Direct)
		return error
	}

	/**
	 * `451`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451
	 */
	// @ts-ignore
	static UnavailableForLegalReasons(...args: ErrParams<451>): _HttpError<451> {
		const error = new (HttpError as any)(451, args[0], Caller.Direct)
		return error
	}

	/**
	 * `500`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
	 */
	// @ts-ignore
	static InternalServerError(...args: ErrParams<500>): _HttpError<500> {
		const error = new (HttpError as any)(500, args[0], Caller.Direct)
		return error
	}

	/**
	 * `501`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
	 */
	// @ts-ignore
	static NotImplemented(...args: ErrParams<501>): _HttpError<501> {
		const error = new (HttpError as any)(501, args[0], Caller.Direct)
		return error
	}

	/**
	 * `502`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
	 */
	// @ts-ignore
	static BadGateway(...args: ErrParams<502>): _HttpError<502> {
		const error = new (HttpError as any)(502, args[0], Caller.Direct)
		return error
	}

	/**
	 * `503`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
	 */
	// @ts-ignore
	static ServiceUnavailable(...args: ErrParams<503>): _HttpError<503> {
		const error = new (HttpError as any)(503, args[0], Caller.Direct)
		return error
	}

	/**
	 * `504`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504
	 */
	// @ts-ignore
	static GatewayTimeout(...args: ErrParams<504>): _HttpError<504> {
		const error = new (HttpError as any)(504, args[0], Caller.Direct)
		return error
	}

	/**
	 * `505`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505
	 */
	// @ts-ignore
	static HTTPVersionNotSupported(...args: ErrParams<505>): _HttpError<505> {
		const error = new (HttpError as any)(505, args[0], Caller.Direct)
		return error
	}

	/**
	 * `506`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506
	 */
	// @ts-ignore
	static VariantAlsoNegotiates(...args: ErrParams<506>): _HttpError<506> {
		const error = new (HttpError as any)(506, args[0], Caller.Direct)
		return error
	}

	/**
	 * `507`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507
	 */
	// @ts-ignore
	static InsufficientStorage(...args: ErrParams<507>): _HttpError<507> {
		const error = new (HttpError as any)(507, args[0], Caller.Direct)
		return error
	}

	/**
	 * `508`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
	 */
	// @ts-ignore
	static LoopDetected(...args: ErrParams<508>): _HttpError<508> {
		const error = new (HttpError as any)(508, args[0], Caller.Direct)
		return error
	}

	/**
	 * `510`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510
	 */
	// @ts-ignore
	static NotExtended(...args: ErrParams<510>): _HttpError<510> {
		const error = new (HttpError as any)(510, args[0], Caller.Direct)
		return error
	}

	/**
	 * `511`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511
	 */
	// @ts-ignore
	static NetworkAuthenticationRequired(...args: ErrParams<511>): _HttpError<511> {
		const error = new (HttpError as any)(511, args[0], Caller.Direct)
		return error
	}
}

/**
 * @public
 */
type ErrParams<S extends _HttpError.Status> = keyof RefletHttp.ErrorParams[S] extends undefined
	? [message?: string]
	: [data: RefletHttp.ErrorParams[S]]

/**
 * @public
 */
type StaticCustomErrors = {
	[K in RefletHttp.CustomErrors[keyof RefletHttp.CustomErrors]]: (
		...args: ErrParams<CustomStatus<K>>
	) => _HttpError<CustomStatus<K>>
}

/**
 * @public
 */
type CustomStatus<V extends RefletHttp.CustomErrors[keyof RefletHttp.CustomErrors]> = {
	[K in keyof RefletHttp.CustomErrors]: RefletHttp.CustomErrors[K] extends V ? K : never
}[keyof RefletHttp.CustomErrors]

/**
 * @public
 */
interface HttpErrorConstructor
	extends Pick<
		typeof HttpError & StaticCustomErrors,
		_HttpError.Name | keyof typeof Error | 'isInstance' | 'getStatus'
	> {
	new <S extends _HttpError.Status>(
		...args: keyof RefletHttp.ErrorParams[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.ErrorParams[S]]
	): _HttpError<S>

	<S extends _HttpError.Status>(
		...args: keyof RefletHttp.ErrorParams[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.ErrorParams[S]]
	): _HttpError<S>
}

/**
 * @internal
 */
const enum Caller {
	Direct,
	Proxy,
}

/**
 * @internal
 */
const proxyHandler: ProxyHandler<new (...args: any[]) => any> = {
	apply(target, _this, args: any[]) {
		return new (target as any)(args[0], args[1], Caller.Proxy)
	},
}

/**
 * HTTP centric error.
 *
 * @param status - HTTP error status code.
 * @param message - Custom message.
 *
 * @remarks
 * - Invocation with or without the `new` keyword.
 * - The error `name` is inferred from `status`,  _e.g._ `400` gives `BadRequest`.
 *
 * ---
 * @example
 * ```ts
 * throw HttpError(400)
 * // ---
 * const err = HttpError.Forbidden('Access denied')
 * next(err)
 * ```
 * ---
 * @class
 * @public
 */
const _HttpError: HttpErrorConstructor = new Proxy<any>(HttpError, proxyHandler)

type _HttpError<S extends _HttpError.Status> = HttpError<S> & Omit<RefletHttp.ErrorParams[S], 'message'>

namespace _HttpError {
	/**
	 * Available status codes.
	 */
	export type Status = RefletHttp.ErrorConstraint extends { status: infer S extends number }
		? S
		: keyof OriginalErrors | keyof RefletHttp.CustomErrors

	/**
	 * Available error names.
	 */
	export type Name =
		| OriginalErrors[Extract<keyof OriginalErrors, _HttpError.Status>]
		| RefletHttp.CustomErrors[Extract<keyof RefletHttp.CustomErrors, _HttpError.Status>]

	/**
	 * Parameter for a specific error status.
	 * _Useful if the error interface has been augmented._
	 */
	export type Param<S extends _HttpError.Status> = ErrParams<S>[0]
}

export { _HttpError as HttpError }

declare global {
	namespace RefletHttp {
		/**
		 * Whitelist or widen status codes.
		 * @example
		 * ```ts
		 * declare global {
		 *   namespace RefletHttp {
		 *     interface ErrorConstraint {
		 *       status: 400 | 401 | 403 | 404 | 405 | 422 | 500
		 *     }
		 *   }
		 * }
		 * ```
		 */
		interface ErrorConstraint {
			// status: number
		}

		/**
		 * Create custom errors with their own augmented parameter.
		 * @example
		 * ```ts
		 * declare global {
		 *   namespace RefletHttp {
		 *     interface ErrorParams {
		 *       405: {
		 *         message?: string
		 *         headers: {
		 *           allow: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[]
		 *         }
		 *       }
		 *
		 *       429: {
		 *         message?: string
		 *         headers: {
		 *           'retry-after': number
		 *         }
		 *       }
		 *     }
		 *   }
		 * }
		 * ```
		 */
		interface ErrorParams extends Record<_HttpError.Status, {}> {}

		/**
		 * Whitelist or widen status codes.
		 * @example
		 * ```ts
		 * declare global {
		 *   namespace RefletHttp {
		 *     interface CustomErrors {
		 *       299: 'Aborted'
		 *       420: 'EnhanceYourCalm'
		 *     }
		 *   }
		 * }
		 * ```
		 */
		interface CustomErrors {}
	}
}

export function defineCustomErrors(errors: RefletHttp.CustomErrors) {
	for (const status in errors) {
		if (!Object.prototype.hasOwnProperty.call(errors, status)) continue

		if (status in OriginalErrors) {
			console.warn(`RefletHttpWarning: [HttpError] Status "${status}" already exists and cannot be redefined.`)
			continue
		}

		const statusNum = Number(status)

		if (Number.isNaN(statusNum)) {
			console.warn(`RefletHttpWarning: [HttpError] Custom status "${status}" should be a numeric value.`)
			continue
		}

		const name = (errors as any)[status]

		if (typeof name !== 'string') {
			console.warn(`RefletHttpWarning: [HttpError] Name for custom status "${status}" should be a string.`)
			continue
		}

		const existing = Object.values(OriginalErrors)

		if (existing.includes(name as any)) {
			console.warn(
				`RefletHttpWarning: [HttpError] Name "${name}" for custom status "${status}" already exists and cannot be redefined.`
			)
			continue
		}

		if (name in HttpError) {
			console.warn(
				`RefletHttpWarning: [HttpError] Name "${name}" for custom status "${status}" would overwrite existing static property.`
			)
			continue
		}

		;(OriginalErrors as any)[statusNum] = name

		Object.defineProperty(HttpError, name, {
			value(...args: any[]) {
				const error = new (HttpError as any)(statusNum, args[0], Caller.Direct)
				return error
			},
		})
	}
}
