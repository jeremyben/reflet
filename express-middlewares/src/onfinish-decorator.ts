import { Use, Decorator } from '@reflet/express'
import { Request, Response, NextFunction } from 'express'
import { ResponseReadonly } from './interfaces'

/**
 * Triggers a side-effect on the `finish` event of the response.
 *
 * @param effect - callback that should not return anything. Gives access to Request and Response objects.
 * @param exposeBody - exposes the response body as `body` property on the Response object.
 *
 * @remarks
 * Exceptions will be caught and logged to stderr instead of crashing the server.
 *
 * ------
 * Example :
 * ```ts
 * class Foo {
 *   ＠UseOnFinish((req, res) => {
 *     console.log('request:', req.method, req.originalUrl, req.body)
 *     console.log('response:', res.statusCode, res.body)
 *   }, true)
 *   ＠Post('/')
 *   create(＠Res res: Response) {
 *     res.send('done')
 *   }
 * }
 * ```
 * ------
 * If you expose the response body, streaming responses will have their body truncated to the first 64kb, to avoid eating up memory.
 *
 * Works by patching `res.send`, `res.json`, `res.jsonp`, `res.write` and `res.end` methods.
 *
 * @see https://nodejs.org/api/http.html#http_event_finish
 *
 * @decorator class, method
 * @public
 */
export function UseOnFinish<ResBody = any>(
	effect: (req: Request, res: ResponseSentAndBody<ResBody>) => void | Promise<void>,
	exposeBody: true
): Decorator.Use

/**
 * {@inheritDoc (UseOnFinish:1)}
 * @public
 */
export function UseOnFinish(effect: (req: Request, res: ResponseSent) => void | Promise<void>): Decorator.Use

export function UseOnFinish<ResBody = any>(
	effect: (req: Request, res: ResponseSentAndBody<ResBody>) => void | Promise<void>,
	exposeBody?: true
) {
	return Use((req: Request, res: Response & { body?: ResBody }, next: NextFunction) => {
		if (exposeBody) {
			const send0 = res.send
			const json0 = res.json
			const jsonp0 = res.jsonp
			const end0 = res.end
			const write0 = res.write

			// object bodies go through: res.send -> res.json (to stringify itself) -> res.send -> res.end,
			// so to avoid retrieving the body twice (and with the wrong type), we patch each method back to the orignal.
			// https://github.com/expressjs/express/blob/4.x/lib/response.js#L158

			res.send = function send(body: ResBody) {
				res.send = send0
				res.json = json0
				res.jsonp = jsonp0
				res.end = end0
				res.write = write0

				res.body = body

				return send0.call(res, body)
			}

			res.json = function json(body: ResBody) {
				res.send = send0
				res.json = json0
				res.jsonp = jsonp0
				res.end = end0
				res.write = write0

				res.body = body

				return json0.call(res, body)
			}

			res.jsonp = function jsonp(body: ResBody) {
				res.send = send0
				res.json = json0
				res.jsonp = jsonp0
				res.end = end0
				res.write = write0

				res.body = body

				return jsonp0.call(res, body)
			}

			// https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback
			res.write = function write(
				data: string | Buffer,
				encodingOrCallback?: string | ((error: any) => void),
				callback?: (error: any) => void
			) {
				// We're waiting for further `write` or `end` calls, so we don't patch back these methods.
				res.send = send0
				res.json = json0
				res.jsonp = jsonp0

				if (data) {
					// Concatenate chunks if multiple write calls.
					res.body = concatChunks(
						data,
						res.body as any,
						encodingOrCallback as BufferEncoding
					) as any
				}

				return write0.apply(res, (arguments as unknown) as Parameters<Response['write']>)
			}

			// https://nodejs.org/api/http.html#http_response_end_data_encoding_callback
			res.end = function end(
				dataOrCallback?: string | Buffer | (() => void),
				encodingOrCallback?: string | (() => void),
				callback?: () => void
			) {
				// Since it's always the last method called, we probably don't need to patch back ?
				// Getting defensive here...
				res.send = send0
				res.json = json0
				res.jsonp = jsonp0
				res.end = end0
				res.write = write0

				// Make sure parameter is of the right type.
				if (dataOrCallback && typeof dataOrCallback !== 'function') {
					// Concatenate chunks if write calls have been made before.
					res.body = concatChunks(
						dataOrCallback,
						res.body as any,
						encodingOrCallback as BufferEncoding
					) as any
				}

				return end0.apply(res, (arguments as unknown) as Parameters<Response['end']>)
			}
		}

		// Log errors instead of letting them crash the server.
		res.on('finish', async () => {
			try {
				await effect(req, res as ResponseReadonly & { body: ResBody })
			} catch (error) {
				console.error(error)
			}
		})

		next()
	})
}

/**
 * Make sure big (streaming) responses don't add up to the memory by limiting body length.
 * Use fs stream default high watermark: 64kb.
 * @internal
 */
function concatChunks(
	chunk: string | Buffer,
	body: string | Buffer | undefined,
	encodingOrCallback: BufferEncoding | Function | undefined,
	bodyMaxLength = 65536
) {
	// Assuming body is the same type as chunk (decided by the first chunk).
	if (Buffer.isBuffer(chunk)) {
		if (!body) return chunk

		if (body.length >= bodyMaxLength) return body

		const chunkMaxLength = bodyMaxLength - body.length
		const goodChunk = chunk.length > chunkMaxLength ? chunk.slice(0, chunkMaxLength) : chunk

		return Buffer.concat([body as Buffer, goodChunk])
	} else {
		const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined

		// Retrieve the encoded response if different than utf8
		if (!body) return encoding ? Buffer.from(chunk, encoding).toString() : chunk

		// To limit at the right length, truncate the string buffer (not the string directly),
		// this might cut the last character (if multi-bytes) and not render it properly.
		// Certainly overkill...
		const bodyLength = Buffer.byteLength(body, encoding)
		if (bodyLength >= bodyMaxLength) return body

		const chunkMaxLength = bodyMaxLength - bodyLength
		const chunkBuffer = Buffer.from(chunk, encoding)
		const goodChunk =
			chunkBuffer.length > chunkMaxLength
				? chunkBuffer.toString(undefined, 0, chunkMaxLength)
				: encoding
				? /* istanbul ignore next - same thing and too difficult to cover */
				  chunkBuffer.toString()
				: chunk

		return (body as string) + goodChunk
	}
}

/**
 * Response object without methods sending the response or modifying its headers, for safety.
 * @public
 */
type ResponseSent = ResponseReadonly & { wasIntercepted?: number }

/**
 * Response object without methods sending the response or modifying its headers, for safety,
 * and with the the response body attached.
 * @public
 */
type ResponseSentAndBody<TBody = any> = ResponseReadonly & { body: TBody; wasIntercepted?: number }
