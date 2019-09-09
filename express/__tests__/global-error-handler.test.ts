import supertest from 'supertest'
import express, { json, Response, NextFunction, Request, ErrorRequestHandler, RequestHandler } from 'express'
import { register, Get, Post, Put, Use } from '../src'
import { hasDefaultErrorHandler } from '../src/error-handler'
import { log } from '../../testing/tools'

@Use(json())
class FooTestController {
	@Get()
	get(req: Request, res: Response, next: NextFunction) {
		res.type('json')
		throw req.httpVersionMajor
	}

	@Put()
	async put(req: Request, res: Response, next: NextFunction) {
		throw Error('wtf')
	}

	@Post()
	post(req: Request, res: Response, next: NextFunction) {
		const err = Error('wtf') as any
		err.status = 418
		throw err
	}
}

const app = express()
const rq = supertest(app)
register(app, [FooTestController])

const afterHandler: RequestHandler = (req, res, next) => next()
const errorHandler: ErrorRequestHandler = (err, req, res, next) => next(err)

describe('default global error handler', () => {
	test('infer json from response Content-Type header', async () => {
		const result = await rq.get('')
		expect(result.type).toBe('application/json')
		expect(result.status).toBe(500)
		expect(result.body).toBe(1)
	})

	test('infer json from request Accept header', async () => {
		const result = await rq.put('').accept('json')
		expect(result.type).toBe('application/json')
		expect(result.status).toBe(500)
		expect(result.body).toEqual({ message: 'wtf' })
	})

	test('infer json from request X-Requested-With header', async () => {
		const result = await rq.post('').set('X-Requested-With', 'XMLHttpRequest')
		expect(result.type).toBe('application/json')
		expect(result.status).toBe(418)
		expect(result.body).toEqual({ status: 418, message: 'wtf' })
	})

	test('cannot infer json and pass to express final handler', async () => {
		const result = await rq.post('')
		expect(result.type).toBe('text/html')
		expect(result.status).toBe(418)
	})

	test('not removed by after middleware', () => {
		app.use((req, res, next) => next())
		app.use([afterHandler, afterHandler])
		expect(hasDefaultErrorHandler(app)).toBe(true)
	})

	test('not removed by after middleware', () => {
		app.use((req, res, next) => next())
		app.use([afterHandler, afterHandler])
		expect(hasDefaultErrorHandler(app)).toBe(true)
	})
})

describe('custom global error handler', () => {
	test('default is removed', async () => {
		expect(hasDefaultErrorHandler(app)).toBe(true)
		expect(app.use.toString()).toContain('defaultErrorHandlerName')

		app.use(afterHandler, [afterHandler, errorHandler])

		expect(hasDefaultErrorHandler(app)).toBe(false)
		// check that app.use is patched back to the original function
		expect(app.use.toString()).not.toContain('defaultErrorHandlerName')
	})

	test('custom handling', async () => {
		const customErrorHandler: ErrorRequestHandler = (err, req, res, next) =>
			err.status === 418 ? res.status(err.status).send({ err }) : next(err)

		app.use(customErrorHandler)

		let result = await rq.get('')
		expect(result.type).toBe('text/html')

		result = await rq.post('')
		expect(result.type).toBe('application/json')
		expect(result.status).toBe(418)
	})
})
