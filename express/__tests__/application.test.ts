import * as supertest from 'supertest'
import * as express from 'express'
import { Application, Catch, Get, Post, Router, Send, Use } from '../src'
import { getGlobalMiddlewares } from '../src/register'
import { log } from '../../testing/tools'

test('simple app', async () => {
	@Send()
	@Router('/')
	class Simple {
		@Get('/simple')
		getOne() {
			return 'simple'
		}
	}

	const app = new Application().register([Simple])
	const rq = supertest(app)

	const res = await rq.get('/simple')
	expect(res.text).toBe('simple')
	expect(res.type).toBe('text/html')
})

describe('inherit application class', () => {
	@Catch<Error>(function fooErr(err, req, res, next) {
		err.message += 'o'
		next(err)
	})
	@Send.Dont()
	@Router('/')
	class Foo {
		@Get('/foo')
		getOne(req: express.Request, res: express.Response) {
			throw Error('y')
		}
	}

	@Router('/bar')
	class Bar {
		@Get('/')
		getBar() {
			return true
		}
	}

	class Service {
		user = 'Jeremy'
	}

	@Catch<Error>(function barErr(err, req, res, next) {
		err.message += 'l'
		next(err)
	})
	@Catch<Error>(function bazErr(err, req, res, next) {
		err.message += 'o'
		res.send(err.message)
	})
	@Use(express.json(), express.text())
	@Use(async (req, res, next) => {
		res.type('text/plain')
		next()
	})
	@Send()
	class App extends Application {
		constructor(public service: Service) {
			super()
			this.disable('x-powered-by')
			this.register()
		}

		@Use((req, res, next) => {
			res.status(203)
			next()
		})
		@Get('/healthcheck')
		protected healthCheck(req: express.Request, res: express.Response) {
			return this.successText
		}

		private successText = 'success'
	}

	const app = new App(new Service()).register([Foo, Bar])
	const rq = supertest(app)

	test('inheritance', () => {
		expect(app).toHaveProperty('register')
		expect(app).toHaveProperty('successText')
		expect(app).toHaveProperty('healthCheck')
		expect(app).toHaveProperty('service')
		expect(app.service.user).toBe('Jeremy')
	})

	test('send inheritance', async () => {
		const res = await rq.get('/bar')
		expect(res.text).toEqual('true')
	})

	test('middlewares and route', async () => {
		const res = await rq.get('/healthcheck')

		expect(res.header).not.toHaveProperty('x-powered-by')
		expect(res.status).toBe(203)
		expect(res.text).toBe('success')
		expect(res.type).toBe('text/plain')
	})

	test('global middlewares are not added twice after multiple register calls', async () => {
		const globalMwares = getGlobalMiddlewares(app)

		const mwaresCount = globalMwares.reduce((acc, mware) => {
			if (acc.hasOwnProperty(mware.name)) acc[mware.name]++
			else acc[mware.name] = 1
			return acc
		}, {} as Record<string, number>) // tslint:disable-line: no-object-literal-type-assertion

		expect(mwaresCount).toStrictEqual({
			jsonParser: 1,
			textParser: 1,
			'': 1, // anonymous middleware
			barErr: 1,
			bazErr: 1,
		})
	})

	test('error handlers are kept at the end of the stack after multiple register calls', async () => {
		const stack = app._router.stack

		const layerIndex = stack.findIndex((layer) => layer.name === 'bazErr')
		expect(layerIndex).toBe(stack.length - 1)

		const res = await rq.get('/foo')
		expect(res.text).toBe('yolo')
	})
})

test('router scope middlewares', async () => {
	const UseSome = Use((req, res, next) => {
		req.body.data += 1
		next()
	})

	const UseOther = Use((req, res, next) => {
		req.body.data += 10
		next()
	})

	@Router('/')
	@UseSome
	class One {
		@Post('/1')
		getTwo(req: express.Request, res: express.Response) {
			return { foo: req.body.data }
		}
	}

	@Router('/')
	@Router.ScopedMiddlewares.Dont
	@UseOther
	class Two {
		@Post('/2')
		getTwo(req: express.Request, res: express.Response) {
			return { foo: req.body.data }
		}
	}

	@Router('/')
	class Three {
		@Post('/3')
		getTwo(req: express.Request, res: express.Response) {
			return { foo: req.body.data }
		}
	}

	@Send({ json: true })
	@Use(express.json())
	@Router.ScopedMiddlewares
	class App extends Application {}

	const app = new App().register([One, Two, Three])
	const rq = supertest(app)

	const res1 = await rq.post('/1').send({ data: 1 })
	expect(res1.status).toBe(200)
	expect(res1.body).toEqual({ foo: 2 })

	const res2 = await rq.post('/2').send({ data: 1 })
	expect(res2.status).toBe(200)
	expect(res2.body).toEqual({ foo: 11 })

	const res3 = await rq.post('/3').send({ data: 10 })
	expect(res3.status).toBe(200)
	expect(res3.body).toEqual({ foo: 20 })
})
