import supertest from 'supertest'
import express, { json, Response, NextFunction, Request, ErrorRequestHandler, RequestHandler } from 'express'
import { register, Get, Post, Put, Use, Patch } from '../src'
import { hasGlobalErrorHandler } from '../src/global-error-handler'
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

	@Patch('/:type')
	patch(req: Request, res: Response, next: NextFunction) {
		const { type } = req.params

		// tslint:disable: no-string-throw
		if (type === 'string') throw '400: impossible'
		if (type === 'wrong-string') throw 'wtf'
		if (type === 'number') throw 400
		if (type === 'wrong-number') throw 200
		if (type === 'object') throw { status: 401.25 }
		if (type === 'Error') throw Error('503.what')
	}
}

const app = express()
const rq = supertest(app)
register(app, [FooTestController])

const afterHandler: RequestHandler = (req, res, next) => next()
const errorHandler: ErrorRequestHandler = (err, req, res, next) => next(err)

describe('default global error handler', () => {
	test('infer json from response Content-Type header', async () => {
		const res = await rq.get('')
		expect(res.type).toBe('application/json')
		expect(res.status).toBe(500)
		expect(res.body).toBe(1)
	})

	test('infer json from request Accept header', async () => {
		const res = await rq.put('').accept('json')
		expect(res.type).toBe('application/json')
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ message: 'wtf' })
	})

	test('infer json from request X-Requested-With header', async () => {
		const res = await rq.post('').set('X-Requested-With', 'XMLHttpRequest')
		expect(res.type).toBe('application/json')
		expect(res.status).toBe(418)
		expect(res.body).toEqual({ status: 418, message: 'wtf' })
	})

	test('cannot infer json and pass to express final handler', async () => {
		const res = await rq.post('')
		expect(res.type).toBe('text/html')
		expect(res.status).toBe(418)
	})

	test('not removed by after middleware', () => {
		app.use((req, res, next) => next())
		app.use([afterHandler, afterHandler])
		expect(hasGlobalErrorHandler(app)).toBe(true)
	})

	test('not removed by after middleware', () => {
		app.use((req, res, next) => next())
		app.use([afterHandler, afterHandler])
		expect(hasGlobalErrorHandler(app)).toBe(true)
	})
})

describe('error status parsing', () => {
	test('string', async () => {
		await rq.patch('/string').expect(400)
		await rq.patch('/wrong-string').expect(500)
	})

	test('number', async () => {
		await rq.patch('/number').expect(400)
		await rq.patch('/wrong-number').expect(500)
	})

	test('object', async () => {
		await rq.patch('/object').expect(401)
	})

	test('Error instance', async () => {
		await rq.patch('/Error').expect(503)
	})
})

describe('custom global error handler', () => {
	test('default is removed', async () => {
		expect(hasGlobalErrorHandler(app)).toBe(true)
		expect(app.use.toString()).toContain('globalErrorHandler')

		app.use(afterHandler, [afterHandler, errorHandler])

		expect(hasGlobalErrorHandler(app)).toBe(false)
		// check that app.use is patched back to the original function
		expect(app.use.toString()).not.toContain('globalErrorHandler')
	})

	test('custom handling', async () => {
		const customErrorHandler: ErrorRequestHandler = (err, req, resp, next) =>
			err.status === 418 ? resp.status(err.status).send({ err }) : next(err)

		app.use(customErrorHandler)

		let res = await rq.get('')
		expect(res.type).toBe('text/html')

		res = await rq.post('')
		expect(res.type).toBe('application/json')
		expect(res.status).toBe(418)
	})
})
