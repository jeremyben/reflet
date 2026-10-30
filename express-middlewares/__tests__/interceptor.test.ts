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

test('rejected transform is forwarded to error handlers', async () => {
	@Router('/rejected-transform')
	class RejectedTransform {
		@UseInterceptor<string>(async () => {
			throw Error('transform')
		})
		@Get()
		get(req: express.Request, res: express.Response) {
			res.send('data')
		}
	}

	const app = register(express(), [RejectedTransform])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)

	const res = await supertest(app).get('/rejected-transform')
	expect(res.status).toBe(500)
	expect(res.text).toBe('transform')
})

test("don't intercept redirections", async () => {
	@Router('/redirect')
	class Redirect {
		@UseInterceptor<string, { data: string }>((data) => ({ data }))
		@Get()
		get(req: express.Request, res: express.Response) {
			res.redirect('/elsewhere')
		}
	}

	const res = await supertest(register(express(), [Redirect]))
		.get('/redirect')
		.redirects(0)
	expect(res.status).toBe(302)
	expect(res.header.location).toBe('/elsewhere')
})

describe('transform throwing synchronously', () => {
	const throwing = UseInterceptor<string>(() => {
		throw Error('transform failed')
	})

	@Router('/throwing')
	class Throwing {
		@throwing
		@Get('/direct')
		direct(req: express.Request, res: express.Response) {
			res.send('data')
		}

		@throwing
		@Get('/callback')
		callback(req: express.Request, res: express.Response) {
			setTimeout(() => res.send('data'), 5)
		}

		@throwing
		@Get('/end-callback')
		endCallback(req: express.Request, res: express.Response) {
			setTimeout(() => res.end('data'), 5)
		}
	}

	const app = register(express(), [Throwing])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)
	const rqq = supertest(app)

	test('is forwarded when the response is sent in the handler', async () => {
		const res = await rqq.get('/throwing/direct')
		expect(res.status).toBe(500)
		expect(res.text).toBe('transform failed')
	})

	test('is forwarded when the response is sent in a callback', async () => {
		const res = await rqq.get('/throwing/callback').timeout(1000)
		expect(res.status).toBe(500)
		expect(res.text).toBe('transform failed')
	})

	test('is forwarded when the response is ended in a callback', async () => {
		const res = await rqq.get('/throwing/end-callback').timeout(1000)
		expect(res.status).toBe(500)
		expect(res.text).toBe('transform failed')
	})
})

describe('transform errors reach the closest error handlers', () => {
	const throwing = UseInterceptor<string>(() => {
		throw Error('transform failed')
	})

	const rejecting = UseInterceptor<string>(async () => {
		throw Error('transform rejected')
	})

	const routeCatch = Catch(((err, req, res, next) => {
		res.status(418).send(`route ${err.message}`)
	}) as express.ErrorRequestHandler)

	@Router('/closest')
	class Closest {
		@routeCatch
		@throwing
		@Get('/throwing')
		throwing(req: express.Request, res: express.Response) {
			res.send('data')
		}

		@routeCatch
		@rejecting
		@Get('/rejecting')
		rejecting(req: express.Request, res: express.Response) {
			setTimeout(() => res.send('data'), 5)
		}
	}

	@throwing
	@Catch(((err, req, res, next) => {
		res.status(418).send(`router ${err.message}`)
	}) as express.ErrorRequestHandler)
	@Router('/router-level')
	class RouterLevel {
		@Get()
		get(req: express.Request, res: express.Response) {
			res.send('data')
		}
	}

	const app = register(express(), [Closest, RouterLevel])
	app.use(((err, req, res, next) => res.status(500).send(`app ${err.message}`)) as express.ErrorRequestHandler)
	const rqq = supertest(app)

	test('method interceptor goes to method error handlers', async () => {
		const res = await rqq.get('/closest/throwing')
		expect(res.status).toBe(418)
		expect(res.text).toBe('route transform failed')
	})

	test('method interceptor rejection goes to method error handlers', async () => {
		const res = await rqq.get('/closest/rejecting')
		expect(res.status).toBe(418)
		expect(res.text).toBe('route transform rejected')
	})

	test('router interceptor goes to router error handlers', async () => {
		const res = await rqq.get('/router-level')
		expect(res.status).toBe(418)
		expect(res.text).toBe('router transform failed')
	})
})

test('res.end callback is still called when the transform throws', async () => {
	let called = false

	@Router('/end-callback')
	class EndCallback {
		@UseInterceptor<string>(() => {
			throw Error('transform failed')
		})
		@Get()
		get(req: express.Request, res: express.Response) {
			res.end('data', () => {
				called = true
			})
		}
	}

	const app = register(express(), [EndCallback])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)

	const res = await supertest(app).get('/end-callback')
	expect(res.status).toBe(500)
	expect(called).toBe(true)
})
