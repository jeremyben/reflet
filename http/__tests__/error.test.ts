import { request, IncomingMessage } from 'http'
import * as express from 'express'
import { HttpError, Status } from '../src'

test('name', () => {
	const teapot = HttpError(Status.Error.ImATeapot)
	expect(teapot.name).toBe('ImATeapot')
	expect(teapot.constructor.name).toBe('HttpError')

	const err = HttpError(420)
	expect(err.name).toBe('HttpError')
})

test('inheritance', () => {
	const unauthorized: HttpError<401> = HttpError.Unauthorized('Get out')
	const forbidden: HttpError.Forbidden = new HttpError(403, 'Wrong door')

	expect(unauthorized).toBeInstanceOf(HttpError)
	expect(unauthorized).toBeInstanceOf(Error)
	expect(forbidden).toBeInstanceOf(HttpError)
	expect(forbidden).toBeInstanceOf(Error)
})

test('remove call from stack trace', function checkStack() {
	const linesFromStatic = HttpError.InternalServerError().stack!.split('\n')
	expect(linesFromStatic[1]).toContain(checkStack.name)

	const linesFromNew = new HttpError(500).stack!.split('\n')
	expect(linesFromNew[1]).toContain(checkStack.name)

	const linesFromCall = HttpError(500).stack!.split('\n')
	expect(linesFromCall[1]).toContain(checkStack.name)
})

test('custom data', () => {
	const params: HttpError.BadRequest.Parameter = { message: { foo: 'bar' }, code: 1 }
	const err = HttpError.BadRequest(params)
	expect(err.message).toBe('{"foo":"bar"}')
	expect(err.code).toBe(1)
})

test('enumerability', () => {
	const err = HttpError.BadRequest({ message: { foo: 'bar' } })

	const props = Object.getOwnPropertyNames(err).reduce((acc, prop) => {
		;(acc as any)[prop] = Object.getOwnPropertyDescriptor(err, prop)
		return acc
	}, <Record<keyof HttpError.BadRequest, PropertyDescriptor>>{})

	expect(props.name.enumerable).toBe(false)
	expect(props.message.enumerable).toBe(false)
	expect(props.stack.enumerable).toBe(false)
	expect(props.status.enumerable).toBe(true)

	expect(JSON.parse(JSON.stringify(err))).toStrictEqual({ status: 400 })
})

test('express default error handling', (done) => {
	const server = express()
		.get('/', (req, res, next) => {
			const err = HttpError.MethodNotAllowed({ message: 'foo', headers: { allow: ['GET', 'POST'] } })

			throw err
		})
		.listen(3090, 'localhost', () => {
			request({ hostname: 'localhost', port: 3090, method: 'GET', path: '/' }, (res: IncomingMessage) => {
				expect(res.statusCode).toBe(405)
				expect(res.headers.allow).toEqual('GET, POST')

				res.on('data', (data: Buffer) => {
					// Check stack trace stringification in development env
					expect(data.toString()).toEqual(expect.stringContaining('MethodNotAllowed: foo'))

					server.close()
					done()
				})
			}).end()
		})
})

declare global {
	namespace RefletHttpError {
		interface Constraint {
			status: number
			// constructor: false
		}

		interface HttpErrors {
			420: EnhanceYourCalm
		}

		interface AnyHttpError {}

		interface EnhanceYourCalm {}

		interface BadRequest {
			/** comment */
			message: { foo: string }
			code?: number
		}

		interface MethodNotAllowed {
			message?: string
			headers: {
				allow: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[]
			}
		}
	}
}
