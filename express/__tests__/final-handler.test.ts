import * as express from 'express'
import * as supertest from 'supertest'
import { Use, Catch, Application, Get, finalHandler } from '../src'
import { log } from '../../testing/tools'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
afterEach(() => consoleErrorSpy.mockClear())
afterAll(() => consoleErrorSpy.mockRestore())

describe('final handler', () => {
	@Use((req, res, next) => {
		res.type('json')
		next()
	})
	@Catch(
		finalHandler({
			sendAsJson: 'from-response-type',
			log: true,
			exposeMessage: '4xx',
			exposeName: true,
			cleanStatusAndHeaders: true,
			notFoundHandler: true,
		})
	)
	class App extends Application {
		@Get('/foo')
		foo(req: express.Request, res: express.Response, next: express.NextFunction) {
			throw { status: 400, message: 'Impossible', headers: { 'X-Header': 'test' } }
		}
	}

	const app = new App().register()
	const rq = supertest(app)

	test('json error, clean status and headers', async () => {
		const res = await rq.get('/foo')

		expect(res.status).toBe(400)
		expect(res.type).toBe('application/json')
		expect(res.header['x-header']).toBe('test')
		expect(res.body).toEqual({ message: 'Impossible' })

		expect(consoleErrorSpy).toBeCalledWith({ message: 'Impossible' })
	})

	test('default not found error', async () => {
		const res = await rq.get('/bar/baz')

		expect(res.status).toBe(404)
		expect(res.body).toEqual({ name: 'RouteNotFoundError', message: 'Cannot GET /bar/baz' })

		expect(consoleErrorSpy).toBeCalledWith(expect.any(Error))
	})
})
