/**
 * HTTP centric error inherited from the native Error constructor.
 * @public
 */
class HttpError<S extends _HttpError.Status | OriginalErrorStatus> extends Error {
	/**
	 * HTTP status code.
	 */
	readonly status: S

	/**
	 * Name inferred from status code.
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1.1
	 */
	readonly name: S extends OriginalErrorStatus ? typeof HttpError.names[S] : 'HttpError'

	constructor(
		// Only way to make an argument either required or optional without overloading (which does not work properly without `new` keyword)
		...args: keyof RefletHttp.Errors[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.Errors[S]]
	) {
		super(typeof args[1] === 'string' ? args[1] : '')

		this.name = (<any>HttpError.names)[args[0]] || this.constructor.name
		Object.defineProperty(this, 'name', { enumerable: false }) // keep the original configuration of Error.

		this.status = args[0]

		// Assign properties directly to the error object if the interface was augmented.
		if (typeof args[1] === 'object' && !!args[1]) {
			const data: Record<string, any> = args[1]

			for (const key in data) {
				// Prevent prototype pollution or overwriting important properties.
				if (!data.hasOwnProperty(key) || protectedProperties.includes(<any>key)) {
					continue
				}

				if (key === 'message') {
					// Always cast message to string.
					const message: string =
						typeof data[key] === 'string' ? data[key] : data[key] != null ? JSON.stringify(data[key]) : ''

					super.message = message // attach to parent to keep message non-enumerable.
				} else {
					this[key as 'toString'] = data[key]
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

		Error.captureStackTrace(this, constructorOpt)
	}

	static names = {
		// Client errors
		400: <const>'BadRequest',
		401: <const>'Unauthorized',
		402: <const>'PaymentRequired',
		403: <const>'Forbidden',
		404: <const>'NotFound',
		405: <const>'MethodNotAllowed',
		406: <const>'NotAcceptable',
		407: <const>'ProxyAuthenticationRequired',
		408: <const>'RequestTimeout',
		409: <const>'Conflict',
		410: <const>'Gone',
		411: <const>'LengthRequired',
		412: <const>'PreconditionFailed',
		413: <const>'PayloadTooLarge',
		414: <const>'URITooLong',
		415: <const>'UnsupportedMediaType',
		416: <const>'RequestedRangeNotSatisfiable',
		417: <const>'ExpectationFailed',
		418: <const>'ImATeapot',
		421: <const>'MisdirectedRequest',
		422: <const>'UnprocessableEntity',
		423: <const>'Locked',
		424: <const>'FailedDependency',
		425: <const>'UnorderedCollection',
		426: <const>'UpgradeRequired',
		428: <const>'PreconditionRequired',
		429: <const>'TooManyRequests',
		431: <const>'RequestHeaderFieldsTooLarge',
		451: <const>'UnavailableForLegalReasons',

		// Server errors
		500: <const>'InternalServerError',
		501: <const>'NotImplemented',
		502: <const>'BadGateway',
		503: <const>'ServiceUnavailable',
		504: <const>'GatewayTimeout',
		505: <const>'HTTPVersionNotSupported',
		506: <const>'VariantAlsoNegotiates',
		507: <const>'InsufficientStorage',
		508: <const>'LoopDetected',
		510: <const>'NotExtended',
		511: <const>'NetworkAuthenticationRequired',
	}

	/**
	 * `400`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
	 */
	static BadRequest(...args: ErrorParams<400>) {
		const error = new (HttpError as any)(400, args[0], Caller.Direct)
		return error as _HttpError<400>
	}

	/**
	 * `401`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
	 */
	static Unauthorized(...args: ErrorParams<401>) {
		const error = new (HttpError as any)(401, args[0], Caller.Direct)
		return error as _HttpError<401>
	}

	/**
	 * `402`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
	 */
	static PaymentRequired(...args: ErrorParams<402>) {
		const error = new (HttpError as any)(402, args[0], Caller.Direct)
		return error as _HttpError<402>
	}

	/**
	 * `403`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
	 */
	static Forbidden(...args: ErrorParams<403>) {
		const error = new (HttpError as any)(403, args[0], Caller.Direct)
		return error as _HttpError<403>
	}

	/**
	 * `404`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
	 */
	static NotFound(...args: ErrorParams<404>) {
		const error = new (HttpError as any)(404, args[0], Caller.Direct)
		return error as _HttpError<404>
	}

	/**
	 * `405`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
	 */
	static MethodNotAllowed(...args: ErrorParams<405>) {
		const error = new (HttpError as any)(405, args[0], Caller.Direct)
		return error as _HttpError<405>
	}

	/**
	 * `406`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
	 */
	static NotAcceptable(...args: ErrorParams<406>) {
		const error = new (HttpError as any)(406, args[0], Caller.Direct)
		return error as _HttpError<406>
	}

	/**
	 * `407`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407
	 */
	static ProxyAuthenticationRequired(...args: ErrorParams<407>) {
		const error = new (HttpError as any)(407, args[0], Caller.Direct)
		return error as _HttpError<407>
	}

	/**
	 * `408`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408
	 */
	static RequestTimeout(...args: ErrorParams<408>) {
		const error = new (HttpError as any)(408, args[0], Caller.Direct)
		return error as _HttpError<408>
	}

	/**
	 * `409`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
	 */
	static Conflict(...args: ErrorParams<409>) {
		const error = new (HttpError as any)(409, args[0], Caller.Direct)
		return error as _HttpError<409>
	}

	/**
	 * `410`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
	 */
	static Gone(...args: ErrorParams<410>) {
		const error = new (HttpError as any)(410, args[0], Caller.Direct)
		return error as _HttpError<410>
	}

	/**
	 * `411`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411
	 */
	static LengthRequired(...args: ErrorParams<411>) {
		const error = new (HttpError as any)(411, args[0], Caller.Direct)
		return error as _HttpError<411>
	}

	/**
	 * `412`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412
	 */
	static PreconditionFailed(...args: ErrorParams<412>) {
		const error = new (HttpError as any)(412, args[0], Caller.Direct)
		return error as _HttpError<412>
	}

	/**
	 * `413`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
	 */
	static PayloadTooLarge(...args: ErrorParams<413>) {
		const error = new (HttpError as any)(413, args[0], Caller.Direct)
		return error as _HttpError<413>
	}

	/**
	 * `414`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414
	 */
	static URITooLong(...args: ErrorParams<414>) {
		const error = new (HttpError as any)(414, args[0], Caller.Direct)
		return error as _HttpError<414>
	}

	/**
	 * `415`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
	 */
	static UnsupportedMediaType(...args: ErrorParams<415>) {
		const error = new (HttpError as any)(415, args[0], Caller.Direct)
		return error as _HttpError<415>
	}

	/**
	 * `416`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
	 */
	static RequestedRangeNotSatisfiable(...args: ErrorParams<416>) {
		const error = new (HttpError as any)(416, args[0], Caller.Direct)
		return error as _HttpError<416>
	}

	/**
	 * `417`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417
	 */
	static ExpectationFailed(...args: ErrorParams<417>) {
		const error = new (HttpError as any)(417, args[0], Caller.Direct)
		return error as _HttpError<417>
	}

	/**
	 * `418`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
	 */
	static ImATeapot(...args: ErrorParams<418>) {
		const error = new (HttpError as any)(418, args[0], Caller.Direct)
		return error as _HttpError<418>
	}

	/**
	 * `421`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421
	 */
	static MisdirectedRequest(...args: ErrorParams<421>) {
		const error = new (HttpError as any)(421, args[0], Caller.Direct)
		return error as _HttpError<421>
	}

	/**
	 * `422`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
	 */
	static UnprocessableEntity(...args: ErrorParams<422>) {
		const error = new (HttpError as any)(422, args[0], Caller.Direct)
		return error as _HttpError<422>
	}

	/**
	 * `423`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423
	 */
	static Locked(...args: ErrorParams<423>) {
		const error = new (HttpError as any)(423, args[0], Caller.Direct)
		return error as _HttpError<423>
	}

	/**
	 * `424`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424
	 */
	static FailedDependency(...args: ErrorParams<424>) {
		const error = new (HttpError as any)(424, args[0], Caller.Direct)
		return error as _HttpError<424>
	}

	/**
	 * `425`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425
	 */
	static UnorderedCollection(...args: ErrorParams<425>) {
		const error = new (HttpError as any)(425, args[0], Caller.Direct)
		return error as _HttpError<425>
	}

	/**
	 * `426`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426
	 */
	static UpgradeRequired(...args: ErrorParams<426>) {
		const error = new (HttpError as any)(426, args[0], Caller.Direct)
		return error as _HttpError<426>
	}

	/**
	 * `428`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428
	 */
	static PreconditionRequired(...args: ErrorParams<428>) {
		const error = new (HttpError as any)(428, args[0], Caller.Direct)
		return error as _HttpError<428>
	}

	/**
	 * `429`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
	 */
	static TooManyRequests(...args: ErrorParams<429>) {
		const error = new (HttpError as any)(429, args[0], Caller.Direct)
		return error as _HttpError<429>
	}

	/**
	 * `431`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431
	 */
	static RequestHeaderFieldsTooLarge(...args: ErrorParams<431>) {
		const error = new (HttpError as any)(431, args[0], Caller.Direct)
		return error as _HttpError<431>
	}

	/**
	 * `451`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451
	 */
	static UnavailableForLegalReasons(...args: ErrorParams<451>) {
		const error = new (HttpError as any)(451, args[0], Caller.Direct)
		return error as _HttpError<451>
	}

	/**
	 * `500`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
	 */
	static InternalServerError(...args: ErrorParams<500>) {
		const error = new (HttpError as any)(500, args[0], Caller.Direct)
		return error as _HttpError<500>
	}

	/**
	 * `501`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
	 */
	static NotImplemented(...args: ErrorParams<501>) {
		const error = new (HttpError as any)(501, args[0], Caller.Direct)
		return error as _HttpError<501>
	}

	/**
	 * `502`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
	 */
	static BadGateway(...args: ErrorParams<502>) {
		const error = new (HttpError as any)(502, args[0], Caller.Direct)
		return error as _HttpError<502>
	}

	/**
	 * `503`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
	 */
	static ServiceUnavailable(...args: ErrorParams<503>) {
		const error = new (HttpError as any)(503, args[0], Caller.Direct)
		return error as _HttpError<503>
	}

	/**
	 * `504`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504
	 */
	static GatewayTimeout(...args: ErrorParams<504>) {
		const error = new (HttpError as any)(504, args[0], Caller.Direct)
		return error as _HttpError<504>
	}

	/**
	 * `505`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505
	 */
	static HTTPVersionNotSupported(...args: ErrorParams<505>) {
		const error = new (HttpError as any)(505, args[0], Caller.Direct)
		return error as _HttpError<505>
	}

	/**
	 * `506`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506
	 */
	static VariantAlsoNegotiates(...args: ErrorParams<506>) {
		const error = new (HttpError as any)(506, args[0], Caller.Direct)
		return error as _HttpError<506>
	}

	/**
	 * `507`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507
	 */
	static InsufficientStorage(...args: ErrorParams<507>) {
		const error = new (HttpError as any)(507, args[0], Caller.Direct)
		return error as _HttpError<507>
	}

	/**
	 * `508`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
	 */
	static LoopDetected(...args: ErrorParams<508>) {
		const error = new (HttpError as any)(508, args[0], Caller.Direct)
		return error as _HttpError<508>
	}

	/**
	 * `510`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510
	 */
	static NotExtended(...args: ErrorParams<510>) {
		const error = new (HttpError as any)(510, args[0], Caller.Direct)
		return error as _HttpError<510>
	}

	/**
	 * `511`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511
	 */
	static NetworkAuthenticationRequired(...args: ErrorParams<511>) {
		const error = new (HttpError as any)(511, args[0], Caller.Direct)
		return error as _HttpError<511>
	}
}

/**
 * @public
 */
const protectedProperties = <const>['__proto__', 'constructor', 'prototype', 'name', 'status', 'stack']

/**
 * @public
 */
type OriginalErrorStatus = keyof typeof HttpError.names

/**
 * @public
 */
interface HttpErrorStatic extends Pick<typeof HttpError, _HttpError.Name | keyof typeof Error> {}

/**
 * @public
 */
interface HttpErrorConstructor {
	new <S extends _HttpError.Status>(
		...args: keyof RefletHttp.Errors[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.Errors[S]]
	): _HttpError<S>

	<S extends _HttpError.Status>(
		...args: keyof RefletHttp.Errors[S] extends undefined
			? [status: S, message?: string]
			: [status: S, data: RefletHttp.Errors[S]]
	): _HttpError<S>
}

/**
 * @public
 */
type ErrorParams<S extends _HttpError.Status | OriginalErrorStatus> = keyof RefletHttp.Errors[S] extends undefined
	? [message?: string]
	: [data: RefletHttp.Errors[S]]

/**
 * @public
 */
type Augmented<S extends _HttpError.Status | OriginalErrorStatus> = RefletHttp.Errors[S] extends {
	message?: any
}
	? Omit<RefletHttp.Errors[S], 'message'>
	: RefletHttp.Errors[S]

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
const _HttpError: RefletHttp.ErrorConstraint extends { constructor: false }
	? HttpErrorStatic
	: HttpErrorConstructor & HttpErrorStatic = new Proxy<any>(HttpError, proxyHandler)

type _HttpError<S extends _HttpError.Status> = HttpError<S> & Augmented<S>

namespace _HttpError {
	/**
	 * Available status codes.
	 */
	export type Status = RefletHttp.ErrorConstraint extends { status: infer S }
		? S extends number
			? S
			: never
		: OriginalErrorStatus

	/**
	 * Available error names.
	 */
	export type Name = typeof HttpError.names[Extract<OriginalErrorStatus, _HttpError.Status>]

	/**
	 * Parameter for a specific error status.
	 * _Useful if the error interface has been augmented._
	 */
	export type Parameter<S extends _HttpError.Status> = ErrorParams<S>[0]

	/**
	 * `400`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
	 */
	export type BadRequest = _HttpError<400>
	export namespace BadRequest {
		export type Parameter = ErrorParams<400>[0]
	}

	/**
	 * `401`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
	 */
	export type Unauthorized = _HttpError<401>
	export namespace Unauthorized {
		export type Parameter = ErrorParams<401>[0]
	}

	/**
	 * `402`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
	 */
	export type PaymentRequired = _HttpError<402>
	export namespace PaymentRequired {
		export type Parameter = ErrorParams<402>[0]
	}

	/**
	 * `403`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
	 */
	export type Forbidden = _HttpError<403>
	export namespace Forbidden {
		export type Parameter = ErrorParams<403>[0]
	}

	/**
	 * `404`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
	 */
	export type NotFound = _HttpError<404>
	export namespace NotFound {
		export type Parameter = ErrorParams<404>[0]
	}

	/**
	 * `405`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
	 */
	export type MethodNotAllowed = _HttpError<405>
	export namespace MethodNotAllowed {
		export type Parameter = ErrorParams<405>[0]
	}

	/**
	 * `406`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
	 */
	export type NotAcceptable = _HttpError<406>
	export namespace NotAcceptable {
		export type Parameter = ErrorParams<406>[0]
	}

	/**
	 * `407`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407
	 */
	export type ProxyAuthenticationRequired = _HttpError<407>
	export namespace ProxyAuthenticationRequired {
		export type Parameter = ErrorParams<407>[0]
	}

	/**
	 * `408`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408
	 */
	export type RequestTimeout = _HttpError<408>
	export namespace RequestTimeout {
		export type Parameter = ErrorParams<408>[0]
	}

	/**
	 * `409`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
	 */
	export type Conflict = _HttpError<409>
	export namespace Conflict {
		export type Parameter = ErrorParams<409>[0]
	}

	/**
	 * `410`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
	 */
	export type Gone = _HttpError<410>
	export namespace Gone {
		export type Parameter = ErrorParams<410>[0]
	}

	/**
	 * `411`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411
	 */
	export type LengthRequired = _HttpError<411>
	export namespace LengthRequired {
		export type Parameter = ErrorParams<411>[0]
	}

	/**
	 * `412`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412
	 */
	export type PreconditionFailed = _HttpError<412>
	export namespace PreconditionFailed {
		export type Parameter = ErrorParams<412>[0]
	}

	/**
	 * `413`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
	 */
	export type PayloadTooLarge = _HttpError<413>
	export namespace PayloadTooLarge {
		export type Parameter = ErrorParams<413>[0]
	}

	/**
	 * `414`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414
	 */
	export type URITooLong = _HttpError<414>
	export namespace URITooLong {
		export type Parameter = ErrorParams<414>[0]
	}

	/**
	 * `415`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
	 */
	export type UnsupportedMediaType = _HttpError<415>
	export namespace UnsupportedMediaType {
		export type Parameter = ErrorParams<415>[0]
	}

	/**
	 * `416`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
	 */
	export type RequestedRangeNotSatisfiable = _HttpError<416>
	export namespace RequestedRangeNotSatisfiable {
		export type Parameter = ErrorParams<416>[0]
	}

	/**
	 * `417`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417
	 */
	export type ExpectationFailed = _HttpError<417>
	export namespace ExpectationFailed {
		export type Parameter = ErrorParams<417>[0]
	}

	/**
	 * `418`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
	 */
	export type ImATeapot = _HttpError<418>
	export namespace ImATeapot {
		export type Parameter = ErrorParams<418>[0]
	}

	/**
	 * `421`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421
	 */
	export type MisdirectedRequest = _HttpError<421>
	export namespace MisdirectedRequest {
		export type Parameter = ErrorParams<421>[0]
	}

	/**
	 * `422`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
	 */
	export type UnprocessableEntity = _HttpError<422>
	export namespace UnprocessableEntity {
		export type Parameter = ErrorParams<422>[0]
	}

	/**
	 * `423`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423
	 */
	export type Locked = _HttpError<423>
	export namespace Locked {
		export type Parameter = ErrorParams<423>[0]
	}

	/**
	 * `424`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424
	 */
	export type FailedDependency = _HttpError<424>
	export namespace FailedDependency {
		export type Parameter = ErrorParams<424>[0]
	}

	/**
	 * `425`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425
	 */
	export type UnorderedCollection = _HttpError<425>
	export namespace UnorderedCollection {
		export type Parameter = ErrorParams<425>[0]
	}

	/**
	 * `426`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426
	 */
	export type UpgradeRequired = _HttpError<426>
	export namespace UpgradeRequired {
		export type Parameter = ErrorParams<426>[0]
	}

	/**
	 * `428`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428
	 */
	export type PreconditionRequired = _HttpError<428>
	export namespace PreconditionRequired {
		export type Parameter = ErrorParams<428>[0]
	}

	/**
	 * `429`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
	 */
	export type TooManyRequests = _HttpError<429>
	export namespace TooManyRequests {
		export type Parameter = ErrorParams<429>[0]
	}

	/**
	 * `431`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431
	 */
	export type RequestHeaderFieldsTooLarge = _HttpError<431>
	export namespace RequestHeaderFieldsTooLarge {
		export type Parameter = ErrorParams<431>[0]
	}

	/**
	 * `451`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451
	 */
	export type UnavailableForLegalReasons = _HttpError<451>
	export namespace UnavailableForLegalReasons {
		export type Parameter = ErrorParams<451>[0]
	}

	/**
	 * `500`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
	 */
	export type InternalServerError = _HttpError<500>
	export namespace InternalServerError {
		export type Parameter = ErrorParams<500>[0]
	}

	/**
	 * `501`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
	 */
	export type NotImplemented = _HttpError<501>
	export namespace NotImplemented {
		export type Parameter = ErrorParams<501>[0]
	}

	/**
	 * `502`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
	 */
	export type BadGateway = _HttpError<502>
	export namespace BadGateway {
		export type Parameter = ErrorParams<502>[0]
	}

	/**
	 * `503`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
	 */
	export type ServiceUnavailable = _HttpError<503>
	export namespace ServiceUnavailable {
		export type Parameter = ErrorParams<503>[0]
	}

	/**
	 * `504`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504
	 */
	export type GatewayTimeout = _HttpError<504>
	export namespace GatewayTimeout {
		export type Parameter = ErrorParams<504>[0]
	}

	/**
	 * `505`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505
	 */
	export type HTTPVersionNotSupported = _HttpError<505>
	export namespace HTTPVersionNotSupported {
		export type Parameter = ErrorParams<505>[0]
	}

	/**
	 * `506`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506
	 */
	export type VariantAlsoNegotiates = _HttpError<506>
	export namespace VariantAlsoNegotiates {
		export type Parameter = ErrorParams<506>[0]
	}

	/**
	 * `507`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507
	 */
	export type InsufficientStorage = _HttpError<507>
	export namespace InsufficientStorage {
		export type Parameter = ErrorParams<507>[0]
	}

	/**
	 * `508`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
	 */
	export type LoopDetected = _HttpError<508>
	export namespace LoopDetected {
		export type Parameter = ErrorParams<508>[0]
	}

	/**
	 * `510`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510
	 */
	export type NotExtended = _HttpError<510>
	export namespace NotExtended {
		export type Parameter = ErrorParams<510>[0]
	}

	/**
	 * `511`
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511
	 */
	export type NetworkAuthenticationRequired = _HttpError<511>
	export namespace NetworkAuthenticationRequired {
		export type Parameter = ErrorParams<511>[0]
	}
}

export { _HttpError as HttpError }

declare global {
	namespace RefletHttp {
		/**
		 * Whitelist or widen status codes, and forbid the use of the `HttpError` constructor (only allow static methods).
		 * @example
		 * ```ts
		 * declare global {
		 *   namespace RefletHttp {
		 *     interface ErrorConstraint {
		 *       status: 400 | 401 | 403 | 404 | 405 | 422 | 500
		 *       constructor: false
		 *     }
		 *   }
		 * }
		 * ```
		 */
		interface ErrorConstraint {
			// status: number
			// constructor: never
		}

		/**
		 * Create custom errors with their own augmented parameter.
		 * @example
		 * ```ts
		 * declare global {
		 *   namespace RefletHttp {
		 *     interface ErrorConstraint {
		 *       status: number
		 *     }
		 *
		 *     interface Errors {
		 *       420: EnhanceYourCalm
		 *     }
		 *
		 *     interface EnhanceYourCalm {
		 *       title: string
		 *       message: string
		 *     }
		 *   }
		 * }
		 * ```
		 */
		interface Errors extends Record<_HttpError.Status | OriginalErrorStatus, {}> {
			400: BadRequest
			401: Unauthorized
			402: PaymentRequired
			403: Forbidden
			404: NotFound
			405: MethodNotAllowed
			406: NotAcceptable
			407: ProxyAuthenticationRequired
			408: RequestTimeout
			409: Conflict
			410: Gone
			411: LengthRequired
			412: PreconditionFailed
			413: PayloadTooLarge
			414: URITooLong
			415: UnsupportedMediaType
			416: RequestedRangeNotSatisfiable
			417: ExpectationFailed
			418: ImATeapot
			421: MisdirectedRequest
			423: Locked
			424: FailedDependency
			425: UnorderedCollection
			426: UpgradeRequired
			428: PreconditionRequired
			429: TooManyRequests
			431: RequestHeaderFieldsTooLarge
			451: UnavailableForLegalReasons

			500: InternalServerError
			501: NotImplemented
			502: BadGateway
			503: ServiceUnavailable
			504: GatewayTimeout
			505: HTTPVersionNotSupported
			506: VariantAlsoNegotiates
			507: InsufficientStorage
			508: LoopDetected
			510: NotExtended
			511: NetworkAuthenticationRequired
		}

		/**
		 * Augment `400` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
		 */
		interface BadRequest {}

		/**
		 * Augment `401` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
		 */
		interface Unauthorized {}

		/**
		 * Augment `402` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
		 */
		interface PaymentRequired {}

		/**
		 * Augment `403` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
		 */
		interface Forbidden {}

		/**
		 * Augment `404` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
		 */
		interface NotFound {}

		/**
		 * Augment `405` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
		 */
		interface MethodNotAllowed {}

		/**
		 * Augment `406` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
		 */
		interface NotAcceptable {}

		/**
		 * Augment `407` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407
		 */
		interface ProxyAuthenticationRequired {}

		/**
		 * Augment `408` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408
		 */
		interface RequestTimeout {}

		/**
		 * Augment `409` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
		 */
		interface Conflict {}

		/**
		 * Augment `410` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
		 */
		interface Gone {}

		/**
		 * Augment `411` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411
		 */
		interface LengthRequired {}

		/**
		 * Augment `412` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412
		 */
		interface PreconditionFailed {}

		/**
		 * Augment `413` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
		 */
		interface PayloadTooLarge {}

		/**
		 * Augment `414` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414
		 */
		interface URITooLong {}

		/**
		 * Augment `415` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
		 */
		interface UnsupportedMediaType {}

		/**
		 * Augment `416` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
		 */
		interface RequestedRangeNotSatisfiable {}

		/**
		 * Augment `417` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417
		 */
		interface ExpectationFailed {}

		/**
		 * Augment `418` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
		 */
		interface ImATeapot {}

		/**
		 * Augment `421` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421
		 */
		interface MisdirectedRequest {}

		/**
		 * Augment `422` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
		 */
		interface UnprocessableEntity {}

		/**
		 * Augment `423` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423
		 */
		interface Locked {}

		/**
		 * Augment `424` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424
		 */
		interface FailedDependency {}

		/**
		 * Augment `425` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425
		 */
		interface UnorderedCollection {}

		/**
		 * Augment `426` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426
		 */
		interface UpgradeRequired {}

		/**
		 * Augment `428` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428
		 */
		interface PreconditionRequired {}

		/**
		 * Augment `429` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
		 */
		interface TooManyRequests {}

		/**
		 * Augment `431` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431
		 */
		interface RequestHeaderFieldsTooLarge {}

		/**
		 * Augment `451` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451
		 */
		interface UnavailableForLegalReasons {}

		/**
		 * Augment `500` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
		 */
		interface InternalServerError {}

		/**
		 * Augment `501` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
		 */
		interface NotImplemented {}

		/**
		 * Augment `502` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
		 */
		interface BadGateway {}

		/**
		 * Augment `503` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
		 */
		interface ServiceUnavailable {}

		/**
		 * Augment `504` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504
		 */
		interface GatewayTimeout {}

		/**
		 * Augment `505` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505
		 */
		interface HTTPVersionNotSupported {}

		/**
		 * Augment `506` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506
		 */
		interface VariantAlsoNegotiates {}

		/**
		 * Augment `507` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507
		 */
		interface InsufficientStorage {}

		/**
		 * Augment `508` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
		 */
		interface LoopDetected {}

		/**
		 * Augment `510` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510
		 */
		interface NotExtended {}

		/**
		 * Augment `511` error.
		 *
		 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511
		 */
		interface NetworkAuthenticationRequired {}
	}
}
