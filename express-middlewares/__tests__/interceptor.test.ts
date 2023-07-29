import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Post, Put, Patch, Catch, Send, Delete, Router } from '@reflet/express'
import { UseInterceptor } from '../src'
import { log } from '../../testing/tools'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

describe('intercept responses', () => {
	@Router('/')
	class Controller {
		@UseInterceptor<{ foo: number; bar: number }>(async (data, { req, res }) => {
			return { ...data, foo: data.foo * 2 }
		})
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send({ foo: 2, bar: 5 })
		}

		@UseInterceptor<{ foo: number }>((data) => ({ foo: data.foo * 2 }))
		@UseInterceptor<{ foo: number }>((data) => ({ foo: data.foo * 2 }))
		@UseInterceptor<{ foo: number }>(async (data) => ({ foo: data.foo * 2 }))
		@Send()
		@Put()
		put() {
			return { foo: 2 }
		}

		@UseInterceptor<string>((data) => `<div>${data}</div>`)
		@UseInterceptor<string>(async (data) => `<p>${data}</p>`)
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.end('foo')
		}

		@UseInterceptor<{ foo: number }>((data, context) => {
			;(context.res as any).send({ bar: 2 })
			return { foo: data.foo * 2 }
		})
		@Patch()
		patch(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send({ foo: 2 })
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('intercept json response with async transform', async () => {
		const res = await rq.get('/')
		expect(res.body).toEqual({ foo: 4, bar: 5 })
	})

	test('multiple interceptors', async () => {
		const res = await rq.put('/')
		expect(res.body).toEqual({ foo: 16 })
	})

	test('intercept end method', async () => {
		const res = await rq.post('/')
		expect(res.text).toBe('<div><p>foo</p></div>')
	})

	test('developer sending the response in the interceptor', async () => {
		const res = await rq.patch('/')
		expect(res.body).toEqual({ bar: 2 })
	})
})

describe("don't intercept", () => {
	@UseInterceptor<string>((data, context) => {
		console.info('intercepted')
		return data + '...'
	})
	@Router('/')
	class Controller {
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			const err = Error() as any
			err.status = 418
			throw err
		}

		@Catch((err, req, res, next) => {
			res.status(422).send(err)
		})
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			next('please stop')
		}

		@Patch()
		patch(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.write('nope')
			res.end('!')
		}

		@Delete()
		delete(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.end()
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('Error instance thrown', async () => {
		const res = await rq.get('/')
		expect(res.status).toBe(418)
		expect(consoleSpy).not.toBeCalledWith('intercepted')
	})

	test('response with status code >= 400', async () => {
		const res = await rq.post('/')
		expect(res.status).toBe(422)
		expect(consoleSpy).not.toBeCalledWith('intercepted')
	})

	test('write method', async () => {
		const res = await rq.patch('/')
		expect(res.text).toBe('nope!')
		expect(consoleSpy).not.toBeCalledWith('intercepted')
	})

	test('empty end method', async () => {
		const res = await rq.delete('/')
		expect(res.text).toBe('')
		expect(consoleSpy).not.toBeCalledWith('intercepted')
	})
})
