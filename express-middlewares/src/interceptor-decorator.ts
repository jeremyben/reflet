import { Use } from '@reflet/express'
import { Request, Response, NextFunction } from 'express'
import { ResponseSafe } from './interfaces'
import { isPromise } from './type-guards'

/**
 * Intercepts and manipulates the response body.
 * @param transform - mapper function that takes the intercepted response body and must return the modified response body. _Gives access to Request and Response objects._
 *
 * @remarks
 * Adds a counter `wasIntercepted` on the Response object.
 *
 * **Errors:**
 * It won't intercept errors, whether the body is an `Error` instance or the status is >= 400.
 * Instead you should use a `@Catch` decorator.
 *
 * **Streams:**
 * It won't intercept streaming responses either (_e.g. files sent with `res.sendFile`_).
 * Instead you should use a [transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform).
 * In fact, it won't intercept any data sent with `res.write` native method.
 *
 * Works by patching `res.send`, `res.json`, `res.jsonp` and `res.end` methods.
 *
 * @example
 * ```ts
 * ＠UseInterceptor<{ foo: number }>((data, context) => {
 *   return { foo: data.foo * 5 }
 * })
 * ＠Get('/')
 * get(＠Res res: Response) {
 *   res.send({ foo: 1 }) // expect { foo: 5 }
 * }
 * ```
 * ------
 * @public
 */
export function UseInterceptor<T, U = T>(
	transform: (
		data: T,
		context: { req: Request; res: ResponseSafe }
	) => U extends void ? never : U | Promise<U>
) {
	return Use((req: Request, res: Response & { wasIntercepted?: number }, next: NextFunction) => {
		res.wasIntercepted = 0

		const send0 = res.send
		const json0 = res.json
		const jsonp0 = res.jsonp
		const end0 = res.end

		// object bodies go through: res.send -> res.json (to stringify itself) -> res.send -> res.end,
		// so to avoid transforming twice, we patch each method back to the orignal.
		// https://github.com/expressjs/express/blob/4.x/lib/response.js#L158
		// That's what express-mung does:
		// https://github.com/richardschneider/express-mung/blob/v0.5.1/index.js#L72

		res.send = function send(body: T) {
			res.send = send0
			res.json = json0
			res.jsonp = jsonp0
			res.end = end0

			// Don't intercept errors.
			if (body instanceof Error || res.statusCode >= 400) {
				return send0.call(res, body)
			}

			const result = transform(body, { req, res })
			res.wasIntercepted!++

			// Response has been sent from the interceptor (bad bad programmer).
			if (res.finished) return res

			if (isPromise(result)) {
				return result.then((value) => send0.call(res, value)) as any
			} else {
				return send0.call(res, result)
			}
		}

		/* istanbul ignore next - same as res.send */
		res.json = function json(body: T) {
			res.send = send0
			res.json = json0
			res.jsonp = jsonp0
			res.end = end0

			// Don't intercept errors.
			if (body instanceof Error || res.statusCode >= 400) {
				return json0.call(res, body)
			}

			const result = transform(body, { req, res })
			res.wasIntercepted!++

			// Response has been sent from the interceptor (bad bad programmer).
			if (res.finished) return res

			if (isPromise(result)) {
				return result.then((value) => json0.call(res, value)) as any
			} else {
				return json0.call(res, result)
			}
		}

		/* istanbul ignore next - same as res.send */
		res.jsonp = function jsonp(body: T) {
			res.send = send0
			res.json = json0
			res.jsonp = jsonp0
			res.end = end0

			// Don't intercept errors.
			if (body instanceof Error || res.statusCode >= 400) {
				return jsonp0.call(res, body)
			}

			const result = transform(body, { req, res })
			res.wasIntercepted!++

			// Response has been sent from the interceptor (bad bad programmer).
			if (res.finished) return res

			if (isPromise(result)) {
				return result.then((value) => jsonp0.call(res, value)) as any
			} else {
				return jsonp0.call(res, result)
			}
		}

		// https://nodejs.org/api/http.html#http_response_end_data_encoding_callback
		res.end = function end(
			dataOrCallback?: string | Buffer | (() => void),
			encodingOrCallback?: string | (() => void),
			callback?: () => void
		) {
			res.send = send0
			res.json = json0
			res.jsonp = jsonp0
			res.end = end0

			// Don't intercept errors, responses already partly written,
			// or data parameter not fitting the right type.
			if (
				(typeof dataOrCallback !== 'string' && !Buffer.isBuffer(dataOrCallback)) ||
				res.statusCode >= 400 ||
				res.headersSent
			) {
				return end0.apply(res, (arguments as unknown) as Parameters<Response['end']>)
			}

			// Directly modify the data parameter.
			arguments[0] = transform(dataOrCallback as any, { req, res })
			res.wasIntercepted!++

			// Response has been sent from the interceptor (bad bad programmer).
			/* istanbul ignore if - covered in res.send */
			if (res.finished) return res

			if (isPromise(arguments[0])) {
				return arguments[0].then((value: any) => {
					arguments[0] = value
					return end0.apply(res, (arguments as unknown) as Parameters<Response['end']>)
				})
			} else {
				return end0.apply(res, (arguments as unknown) as Parameters<Response['end']>)
			}
		}

		next()
	})
}
