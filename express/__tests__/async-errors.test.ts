import * as supertest from 'supertest'
import * as express from 'express'
import * as http from 'http'
import { AddressInfo } from 'net'
import { Readable } from 'stream'
import { Application, Body, Catch, Get, Post, register, Router, Send, Use } from '../src'
import { getGlobalMiddlewares, getRouterStack } from '../src/register'
import { isExpress4 } from '../src/type-guards'

const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
	res.status(500).send(err.message)
}

describe('promises returned by plain functions are caught', () => {
	@Router('/')
	class Foo {
		@Get('/no-send')
		noSend(req: express.Request, res: express.Response) {
			return Promise.reject(Error('no-send'))
		}

		@Send.Dont()
		@Get('/send-dont')
		sendDont(req: express.Request, res: express.Response) {
			return Promise.reject(Error('send-dont'))
		}

		@Use((req, res, next) => Promise.reject(Error('middleware')) as any)
		@Get('/middleware')
		middleware(req: express.Request, res: express.Response) {
			res.send('unreachable')
		}

		@Catch((err, req, res, next) => Promise.reject(Error(`${err.message} and error-handler`)) as any)
		@Get('/error-handler')
		errHandler(req: express.Request, res: express.Response) {
			throw Error('route')
		}
	}

	const app = express()
	register(app, [Foo])
	app.use(errorHandler)
	const rq = supertest(app)

	test('route without @Send', async () => {
		const res = await rq.get('/no-send')
		expect(res.status).toBe(500)
		expect(res.text).toBe('no-send')
	})

	test('route with @Send.Dont', async () => {
		const res = await rq.get('/send-dont')
		expect(res.status).toBe(500)
		expect(res.text).toBe('send-dont')
	})

	test('middleware', async () => {
		const res = await rq.get('/middleware')
		expect(res.status).toBe(500)
		expect(res.text).toBe('middleware')
	})

	test('error handler', async () => {
		const res = await rq.get('/error-handler')
		expect(res.status).toBe(500)
		expect(res.text).toBe('route and error-handler')
	})

	test('wrappers keep handler names', () => {
		function namedMware(req: express.Request, res: express.Response, next: express.NextFunction) {
			next()
		}

		@Use(namedMware)
		@Router('/named')
		class Named {
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send('ok')
			}
		}

		const namedApp = express()
		register(namedApp, [Named])
		const routerLayer = getRouterStack(namedApp).find(
			(layer: { name: string; handle: unknown }) => layer.name === 'router'
		)!
		const routerStack = (routerLayer.handle as any).stack as { name: string }[]
		expect(routerStack.map((layer) => layer.name)).toContain('namedMware')
	})
})

describe('streams sent with @Send', () => {
	let destroyed = false

	@Send()
	@Router('/stream')
	class Streams {
		@Get('/error')
		error() {
			return new Readable({
				read() {
					this.destroy(Error('stream'))
				},
			})
		}

		@Get('/endless')
		endless() {
			return new Readable({
				read() {
					setImmediate(() => !this.destroyed && this.push('chunk'))
				},
				destroy(err, cb) {
					destroyed = true
					cb(err)
				},
			})
		}
	}

	const app = express()
	register(app, [Streams])
	app.use(errorHandler)

	test('stream error is forwarded to error handlers', async () => {
		const res = await supertest(app).get('/stream/error')
		expect(res.status).toBe(500)
		expect(res.text).toBe('stream')
	})

	test('source stream is destroyed on client disconnection', async () => {
		const server = app.listen(0)
		const { port } = server.address() as AddressInfo

		await new Promise<void>((resolve, reject) => {
			const req = http.get(`http://localhost:${port}/stream/endless`, { agent: false }, (res) => {
				res.once('data', () => req.destroy())
				res.on('close', () => resolve())
			})
			req.on('error', () => resolve())
			setTimeout(() => reject(Error('timeout')), 2000).unref()
		})

		await new Promise((resolve) => setTimeout(resolve, 50))
		await new Promise((resolve) => server.close(resolve))
		expect(destroyed).toBe(true)
	})
})

describe('async global handlers with multiple register calls', () => {
	async function asyncGlobalMware(req: express.Request, res: express.Response, next: express.NextFunction) {
		next()
	}

	@Router('/foo')
	class Foo {
		@Get()
		get(req: express.Request, res: express.Response) {
			throw Error('foo')
		}
	}

	@Router('/bar')
	class Bar {
		@Get()
		get(req: express.Request, res: express.Response) {
			throw Error('bar')
		}
	}

	@Use(asyncGlobalMware)
	@Catch(async function asyncGlobalErr(err, req, res, next) {
		res.status(500).send(`global ${err.message}`)
	})
	class App extends Application {}

	const app = new App().register([Foo]).register([Bar])
	const rq = supertest(app)

	test('global error handler stays last', async () => {
		const res = await rq.get('/bar')
		expect(res.status).toBe(500)
		expect(res.text).toBe('global bar')

		const stack = getRouterStack(app)
		expect(stack[stack.length - 1].name).toBe('asyncGlobalErr')
		expect(stack.filter((layer) => layer.name === 'asyncGlobalErr')).toHaveLength(1)
	})

	test('global middlewares are retrieved unwrapped', () => {
		expect(getGlobalMiddlewares(app)).toContain(asyncGlobalMware)
	})
})

describe('review regressions', () => {
	test('sub-applications are mounted as applications', async () => {
		const subApp = express()
		let mountedOn: express.Application | undefined
		subApp.on('mount', (parent) => (mountedOn = parent))
		subApp.get('/sub', (req, res) => res.send(String(subApp.mountpath)))

		@Use(subApp)
		class App extends Application {}

		const app = new App().register()
		expect(mountedOn).toBe(app)

		const res = await supertest(app).get('/sub')
		expect(res.text).toBe('/')
	})

	test('lazy thenables returned without @Send are not executed', async () => {
		let executed = false
		const lazyQuery = {
			then(resolve: (value: unknown) => void) {
				executed = true
				resolve('result')
			},
			catch() {
				executed = true
			},
		}

		@Router('/lazy')
		class Lazy {
			@Use((req, res, next) => {
				next()
				return lazyQuery as any
			})
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send('ok')
				return lazyQuery
			}
		}

		const app = express()
		register(app, [Lazy])

		const res = await supertest(app).get('/lazy')
		expect(res.text).toBe('ok')
		expect(executed).toBe(false)
	})

	test('response is closed on stream error after headers are sent', async () => {
		@Send()
		@Router('/partial')
		class Partial {
			@Get()
			get() {
				let pushed = false
				return new Readable({
					read() {
						if (!pushed) {
							pushed = true
							this.push('partial')
						} else {
							setImmediate(() => this.destroy(Error('midway')))
						}
					},
				})
			}
		}

		const app = express()
		register(app, [Partial])
		// Error handler that doesn't end the response nor forward the error.
		app.use(((err, req, res, next) => {}) as express.ErrorRequestHandler)

		const error = await supertest(app)
			.get('/partial')
			.timeout(2000)
			.then(
				() => null,
				(err) => err
			)

		// Connection closed by the server rather than a client timeout.
		expect(error).not.toBeNull()
		expect(error.timeout).toBeUndefined()
	})
})

describe('rejections, thenables and arrays of handlers', () => {
	const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
		res.status(500).send(err.message)
	}

	test('falsy rejection is treated as an error', async () => {
		@Router('/falsy')
		class Falsy {
			@Get()
			get(req: express.Request, res: express.Response) {
				return Promise.reject()
			}
		}

		// Same path, registered after: must not be reached.
		@Router('/falsy')
		class Fallthrough {
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send('fell through')
			}
		}

		const app = register(express(), [Falsy, Fallthrough])
		app.use(errorHandler)

		const res = await supertest(app).get('/falsy')
		expect(res.status).toBe(500)
		expect(res.text).toBe('Rejected promise')
	})

	test('thenable without catch is sent', async () => {
		let errorHandled = false

		@Send()
		@Router('/thenable')
		class Thenable {
			@Get()
			get() {
				// Returns nothing from `then`, unlike promises.
				return {
					then(resolve: (value: string) => void) {
						resolve('thenable')
					},
				}
			}
		}

		const app = register(express(), [Thenable])
		app.use(((err, req, res, next) => {
			errorHandled = true
			next(err)
		}) as express.ErrorRequestHandler)

		const res = await supertest(app).get('/thenable')
		await new Promise((resolve) => setImmediate(resolve))
		expect(res.text).toBe('thenable')
		expect(errorHandled).toBe(false)
	})

	test('arrays of middlewares are wrapped', async () => {
		let executed = false
		const lazyQuery = {
			then() {
				executed = true
			},
		}

		@Router('/array')
		class ArrayMwares {
			@Use([
				((req, res, next) => {
					next()
					return lazyQuery
				}) as express.RequestHandler,
				(async () => {
					throw Error('array')
				}) as express.RequestHandler,
			] as any)
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send('ok')
			}
		}

		const app = register(express(), [ArrayMwares])
		app.use(errorHandler)

		const res = await supertest(app).get('/array')
		expect(res.text).toBe('array')
		expect(executed).toBe(false)
	})

	test('whole body follows each express version without body', async () => {
		@Send({ json: true })
		@Router('/whole-body')
		class WholeBody {
			@Post()
			post(@Body() body: object | undefined) {
				return { isUndefined: body === undefined, body }
			}
		}

		const res = await supertest(register(express(), [WholeBody])).post('/whole-body')
		expect(res.status).toBe(200)

		// Express 4 body parsers default to an empty object, express 5 ones leave it undefined.
		if (isExpress4(express.application)) {
			expect(res.body).toEqual({ isUndefined: false, body: {} })
		} else {
			expect(res.body).toEqual({ isUndefined: true })
		}
	})

	test('undecorated class looking like an express router is not mounted as one', () => {
		class LookAlike {
			static stack = []
			static handle() {}
			static use() {}
		}

		expect(() => register(express(), [['/look-alike', LookAlike]])).toThrowError(
			expect.objectContaining({ code: 'ROUTER_DECORATOR_MISSING' })
		)
	})

	test('decorated class looking like an express router is still registered', async () => {
		@Router('/look-alike')
		class LookAlike {
			static stack = []
			static handle() {}
			static use() {}

			@Get()
			get(req: express.Request, res: express.Response) {
				res.send('decorated')
			}
		}

		const res = await supertest(register(express(), [['/look-alike', LookAlike]])).get('/look-alike')
		expect(res.text).toBe('decorated')
	})
})
