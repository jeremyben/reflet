import * as express from 'express'
import * as supertest from 'supertest'
import { HttpError } from '@reflet/http'
import { Use, Catch, Application, Get, finalHandler } from '../src'
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
