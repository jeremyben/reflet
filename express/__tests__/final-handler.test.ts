import * as express from 'express'
import * as supertest from 'supertest'
import { HttpError } from '@reflet/http'
import { Use, Catch, Application, Get, Router, finalHandler } from '../src'
import { getRouterStack } from '../src/register'
import { log } from '../../testing/tools'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
afterEach(() => consoleErrorSpy.mockClear())
afterAll(() => consoleErrorSpy.mockRestore())

describe('final handler', () => {
	@Catch(
		finalHandler({
			json: 'from-response-type-or-request',
			expose(status) {
				if (status >= 500) return ['name']
				return ['name', 'message']
			},
			log(err, req, res) {
				setImmediate(() =>
					console.error({
						err,
						status: res.statusCode,
						path: req.originalUrl,
					})
				)
			},
			notFoundHandler: 499,
		})
	)
	class App extends Application {
		@Use((req, res, next) => {
			res.type('json')
			next()
		})
		@Get('/foo')
		foo(req: express.Request, res: express.Response, next: express.NextFunction) {
			const err = Error('Impossible') as any
			err.status = 400
			err.headers = { 'X-Header': 'test' }
			throw err
		}

		@Get('/bar')
		bar(req: express.Request, res: express.Response, next: express.NextFunction) {
			throw HttpError.UnprocessableEntity('I dont like this data')
		}
	}

	const app = new App().register()
	const rq = supertest(app)

	test('json error', async () => {
		const res = await rq.get('/foo')

		expect(res.status).toBe(400)
		expect(res.type).toBe('application/json')
		expect(res.header['x-header']).toBe('test')
		expect(res.body).toEqual({ name: 'Error', message: 'Impossible' })

		expect(consoleErrorSpy).toBeCalledWith(
			expect.objectContaining({
				err: expect.objectContaining({ message: 'Impossible' }),
				status: 400,
				path: '/foo',
			})
		)
	})

	test('html error', async () => {
		const res = await rq.get('/bar')

		expect(res.status).toBe(422)
		expect(res.type).toBe('text/html')
		expect(res.text).toContain('UnprocessableEntity: I dont like this data')
	})

	test('default not found error', async () => {
		const res = await rq.get('/bar/baz')

		expect(res.status).toBe(499)
		expect(res.type).toBe('text/html')
		expect(res.text).toContain('RouteNotFoundError: Cannot GET /bar/baz')
		// expect(res.body).toEqual({ name: 'RouteNotFoundError', message: 'Cannot GET /bar/baz' })

		expect(consoleErrorSpy).toBeCalledWith(
			expect.objectContaining({
				err: expect.any(Error),
				status: 499,
				path: '/bar/baz',
			})
		)
	})
})

describe('default logger', () => {
	@Catch(finalHandler({ json: true, expose: false, log: '5xx' }))
	class App extends Application {
		@Get('/server-error')
		serverError() {
			throw Error('server')
		}

		@Get('/client-error')
		clientError() {
			throw HttpError.BadRequest('client')
		}
	}

	const rq = supertest(new App().register())

	test('logs server errors with request context', async () => {
		await rq.get('/server-error?a=1')
		await new Promise((resolve) => setImmediate(resolve))

		expect(consoleErrorSpy).toBeCalledWith('GET /server-error 500', expect.objectContaining({ message: 'server' }))
	})

	test('does not log client errors', async () => {
		await rq.get('/client-error')
		await new Promise((resolve) => setImmediate(resolve))

		expect(consoleErrorSpy).not.toBeCalled()
	})
})

test('warns when exposing everything in production', () => {
	const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
	const nodeEnv = process.env.NODE_ENV

	try {
		process.env.NODE_ENV = 'production'
		finalHandler({ json: true, expose: true })
		finalHandler({ json: true, expose: ['message'] })
		expect(consoleWarnSpy).toBeCalledTimes(1)

		process.env.NODE_ENV = 'development'
		finalHandler({ json: true, expose: true })
		expect(consoleWarnSpy).toBeCalledTimes(1)
	} finally {
		process.env.NODE_ENV = nodeEnv
		consoleWarnSpy.mockRestore()
	}
})

describe('global final handler with not found handler and multiple register calls', () => {
	@Router('/foo')
	class Foo {
		@Get()
		get() {
			throw HttpError.BadRequest('foo')
		}
	}

	@Router('/bar')
	class Bar {
		@Get()
		get() {
			throw HttpError.BadRequest('bar')
		}
	}

	@Catch(finalHandler({ json: true, expose: ['message'], notFoundHandler: true }))
	class App extends Application {}

	const app = new App().register([Foo]).register([Bar])
	const rq = supertest(app)

	test('stays global for routers of every register call', async () => {
		const foo = await rq.get('/foo')
		expect(foo.status).toBe(400)
		expect(foo.body).toEqual({ message: 'foo' })

		const bar = await rq.get('/bar')
		expect(bar.status).toBe(400)
		expect(bar.body).toEqual({ message: 'bar' })

		const notFound = await rq.get('/baz')
		expect(notFound.status).toBe(404)
		expect(notFound.body).toEqual({ message: 'Cannot GET /baz' })
	})

	test('is not added twice', () => {
		const names = getRouterStack(app).map((layer: { name: string }) => layer.name)
		expect(names.filter((name: string) => name === 'notFoundHandler')).toHaveLength(1)
		expect(names.filter((name: string) => name === 'finalErrorHandler')).toHaveLength(1)
		expect(names.slice(-2)).toEqual(['notFoundHandler', 'finalErrorHandler'])
	})
})

test('non-integer error status is ignored', async () => {
	@Catch(finalHandler({ json: true, expose: ['message'] }))
	class App extends Application {
		@Get('/float')
		float() {
			throw Object.assign(Error('float'), { status: 404.5 })
		}
	}

	const res = await supertest(new App().register()).get('/float')
	expect(res.status).toBe(500)
	expect(res.body).toEqual({ message: 'float' })
})

test('non-integer response status is ignored', async () => {
	@Catch(finalHandler({ json: true, expose: ['message'] }))
	class App extends Application {
		@Get('/float-response')
		float(req: express.Request, res: express.Response) {
			res.status(404.5)
			throw Error('float response')
		}
	}

	const res = await supertest(new App().register()).get('/float-response')
	expect(res.status).toBe(500)
	expect(res.body).toEqual({ message: 'float response' })
})
