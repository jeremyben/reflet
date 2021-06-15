import * as supertest from 'supertest'
import * as express from 'express'
import { Application, Catch, Get, Use } from '../src'
import { getGlobalMiddlewares } from '../src/register'
import { log } from '../../testing/tools'

describe('inherit application class', () => {
	@Catch<Error>(function fooErr(err, req, res, next) {
		err.message += 'o'
		next(err)
	})
	class Foo {
		@Get('/foo')
		getOne(req: express.Request, res: express.Response) {
			throw Error('y')
		}
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
	class App extends Application {
		constructor() {
			super()
			this.disable('x-powered-by')
			this.register()
		}

		@Use((req, res, next) => {
			res.status(203)
			next()
		})
		@Get('/healthcheck')
		protected healthcheck(req: express.Request, res: express.Response) {
			res.send(this.text)
		}

		private text = 'success'
	}

	const app = new App().register([Foo])
	const rq = supertest(app)

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
