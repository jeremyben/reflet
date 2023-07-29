import { request, IncomingMessage } from 'http'
import * as express from 'express'
import { defineCustomErrors, HttpError, Status } from '../src'

test('name', () => {
	const teapot = HttpError(Status.Error.ImATeapot)
	expect(teapot.name).toBe('ImATeapot')
	expect(teapot.constructor.name).toBe('HttpError')

	const err = HttpError(420)
	expect(err.name).toBe('HttpError')
})

test('inheritance', () => {
	const unauthorized: HttpError<401> = HttpError.Unauthorized('Get out')
	const forbidden: HttpError<403> = new HttpError(403, 'Wrong door')

	expect(unauthorized).toBeInstanceOf(HttpError)
	expect(unauthorized).toBeInstanceOf(Error)
	expect(forbidden).toBeInstanceOf(HttpError)
	expect(forbidden).toBeInstanceOf(Error)
})

test('static methods', () => {
	const generic = new Error('generic') as any
	generic.statusCode = 400

	expect(HttpError.isInstance(generic, [400, 405])).toBe(false)

	const forbidden = new HttpError(403)
	expect(HttpError.isInstance(forbidden, 403)).toBe(true)

	const status = HttpError.getStatus({}, generic, { status: 200 })
	expect(status).toBe(400)
})

test('remove call from stack trace', function checkStack() {
	const linesFromStatic = HttpError.InternalServerError().stack!.split('\n')
	expect(linesFromStatic[1]).toContain(checkStack.name)

	const linesFromNew = new HttpError(500).stack!.split('\n')
	expect(linesFromNew[1]).toContain(checkStack.name)

	const linesFromCall = HttpError(500).stack!.split('\n')
	expect(linesFromCall[1]).toContain(checkStack.name)
})

test('custom params', () => {
	const params: HttpError.Param<400> = { message: { foo: 'bar' }, code: 1 }
	const err = HttpError.BadRequest(params)

	expect(err.message).toBe('{"foo":"bar"}')
	expect(err.code).toBe(1)
})

test('enumerability', () => {
	const err = HttpError.BadRequest({ message: { foo: 'bar' } })

	const props = Object.getOwnPropertyNames(err).reduce((acc, prop) => {
		;(acc as any)[prop] = Object.getOwnPropertyDescriptor(err, prop)
		return acc
	}, <Record<keyof HttpError<400>, PropertyDescriptor>>{})

	expect(props.name.enumerable).toBe(false)
	expect(props.message.enumerable).toBe(false)
	expect(props.stack.enumerable).toBe(false)
	expect(props.status.enumerable).toBe(true)

	expect(JSON.parse(JSON.stringify(err))).toStrictEqual({ status: 400 })
})

test('custom errors', () => {
	defineCustomErrors({ 299: 'Aborted', 420: 'EnhanceYourCalm' })

	const e420 = HttpError.EnhanceYourCalm('foo')
	expect(e420.name).toBe('EnhanceYourCalm')
	expect(e420.status).toBe(420)

	const e299 = new HttpError(299, { data: 'bar' })
	expect(e299.name).toBe('Aborted')
	expect(e299.status).toBe(299)
	expect(e299.data).toBe('bar')
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
	namespace RefletHttp {
		interface ErrorConstraint {
			status: 299 | 420 | 400 | 401 | 403 | 405 | 418 | 500
		}

		interface CustomErrors {
			299: 'Aborted'
			420: 'EnhanceYourCalm'
		}

		interface ErrorParams {
			400: {
				/** test comment */
				message: { foo: string }
				code?: number
			}

			405: {
				message?: string
				headers: {
					allow: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[]
				}
			}

			299: { data: string }
		}
	}
}
