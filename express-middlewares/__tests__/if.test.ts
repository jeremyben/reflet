import * as supertest from 'supertest'
import * as express from 'express'
import { register, Post, Put, Router } from '@reflet/express'
import { UseIf } from '../src'
import { log } from '../../testing/tools'

@UseIf((req) => req.method === 'POST', [express.json()])
@UseIf(async (req) => req.method === 'PUT', [express.urlencoded({ extended: true })])
@Router('/')
class Controller {
	@Post()
	post(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.json(req.body)
	}

	@Put()
	put(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.json(req.body)
	}
}

const rq = supertest(register(express(), [Controller]))

test('condition pass', async () => {
	const res = await rq.post('/').send({ foo: 1 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ foo: 1 })
})

test("condition doesn't pass", async () => {
	const res = await rq.put('/').send({ foo: 1 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({})
})

test('async condition pass', async () => {
	const res = await rq.put('/').send('foo=1')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ foo: '1' })
})

describe('middlewares chaining', () => {
	const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
		res.status(403).send(err.message)
	}

	test('applies middlewares one after the other', async () => {
		const order: string[] = []

		const asyncAuth: express.RequestHandler = (req, res, next) => {
			setTimeout(() => {
				order.push('auth')
				next()
			}, 20)
		}

		const logger: express.RequestHandler = (req, res, next) => {
			order.push('logger')
			next()
		}

		@Router('/chain')
		class Chain {
			@UseIf(() => true, [asyncAuth, logger])
			@Post()
			post(req: express.Request, res: express.Response) {
				order.push('handler')
				res.send('ok')
			}
		}

		const res = await supertest(register(express(), [Chain])).post('/chain')
		expect(res.text).toBe('ok')
		expect(order).toEqual(['auth', 'logger', 'handler'])
	})

	test('stops the chain on error', async () => {
		let reached = false

		const asyncAuth: express.RequestHandler = (req, res, next) => {
			setTimeout(() => next(Error('denied')), 20)
		}

		const logger: express.RequestHandler = (req, res, next) => {
			reached = true
			next()
		}

		@Router('/denied')
		class Denied {
			@UseIf(() => true, [asyncAuth, logger])
			@Post()
			post(req: express.Request, res: express.Response) {
				reached = true
				res.send('secret')
			}
		}

		const app = register(express(), [Denied])
		app.use(errorHandler)

		const res = await supertest(app).post('/denied')
		expect(res.status).toBe(403)
		expect(res.text).toBe('denied')
		expect(reached).toBe(false)
	})

	test('middlewares keep access to request params and url', async () => {
		let seen: object = {}

		@Router('/params')
		class ParamsRouter {
			@UseIf(
				() => true,
				[
					(req, res, next) => {
						seen = { params: req.params, url: req.url, baseUrl: req.baseUrl }
						next()
					},
				]
			)
			@Post('/:id')
			post(req: express.Request, res: express.Response) {
				res.send(req.params.id)
			}
		}

		const res = await supertest(register(express(), [ParamsRouter])).post('/params/42')
		expect(res.text).toBe('42')
		expect(seen).toEqual({ params: { id: '42' }, url: '/42', baseUrl: '/params' })
	})

	test('forwards rejected condition and middleware', async () => {
		@Router('/reject')
		class Reject {
			@UseIf(async () => {
				throw Error('condition')
			}, [])
			@Post('/condition')
			condition(req: express.Request, res: express.Response) {
				res.send('ok')
			}

			@UseIf(() => true, [async () => Promise.reject(Error('middleware'))])
			@Post('/middleware')
			middleware(req: express.Request, res: express.Response) {
				res.send('ok')
			}
		}

		const app = register(express(), [Reject])
		app.use(errorHandler)
		const rqq = supertest(app)

		expect((await rqq.post('/reject/condition')).text).toBe('condition')
		expect((await rqq.post('/reject/middleware')).text).toBe('middleware')
	})
})

test('condition rejected without reason is an error', async () => {
	@Router('/falsy-condition')
	class FalsyCondition {
		@UseIf(() => Promise.reject(), [])
		@Post()
		post(req: express.Request, res: express.Response) {
			res.send('ran')
		}
	}

	const app = register(express(), [FalsyCondition])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)

	const res = await supertest(app).post('/falsy-condition')
	expect(res.status).toBe(500)
	expect(res.text).toBe('Rejected promise')
})
