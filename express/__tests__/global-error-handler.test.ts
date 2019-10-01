import supertest from 'supertest'
import express, { json, Response, NextFunction, Request, ErrorRequestHandler, RequestHandler } from 'express'
import { register, Use, Get, Post, Put, Patch, Delete, Req, Next } from '../src'
import { hasGlobalErrorHandler } from '../src/global-error-handler'
import { log } from '../../testing/tools'

describe('json detection', () => {
	@Use(json())
	class Controller {
		@Get()
		get(req: Request, res: Response) {
			res.type('json')
			throw req.httpVersionMajor
		}

		@Put()
		async put(@Next() next: NextFunction) {
			next(Error('wtf'))
		}

		@Post()
		post() {
			const err = Error('wtf') as any
			err.status = 418
			throw err
		}
	}

	const rq = supertest(register(express(), [Controller]))

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
})

describe('status extraction', () => {
	@Use(json(), (req, res, next) => {
		res.type('json')
		next()
	})
	class Controller {
		@Get()
		get(@Next next: NextFunction, @Req req: Request) {
			// tslint:disable-next-line: variable-name
			let { number } = req.body
			number = Number.parseInt(number, 10)
			next(number)
		}

		@Post()
		async post(req: Request) {
			// tslint:disable-next-line: variable-name
			const { string } = req.body
			throw string
		}

		@Put()
		async put(req: Request) {
			const { message, status } = req.body
			const err = Error(message) as Error & { status: number }
			if (status) err.status = status
			throw err
		}

		@Patch()
		patch(req: Request) {
			throw req.body
		}

		@Delete()
		delete(req: Request, res: Response) {
			res.status(418)
			throw Error('200')
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('infer from number and normalize it', async () => {
		let res = await rq.get('').send({ number: 400 })
		expect(res.status).toBe(400)
		expect(res.body).toEqual({ status: 400, message: '' })

		res = await rq.get('').send({ number: 200 })
		expect(res.status).toBe(500)
		// Don't normalize wrong status
		expect(res.body).toBe(200)
	})

	test('infer from string and normalize it', async () => {
		let res = await rq.post('').send({ string: '400: impossible' })
		expect(res.status).toBe(400)
		expect(res.body).toEqual({ status: 400, message: 'impossible' })

		res = await rq.post('').send({ string: '300 the movie' })
		expect(res.status).toBe(500)
		// Don't normalize wrong status
		expect(res.body).toBe('300 the movie')
	})

	test('infer from Error message and normalize it', async () => {
		let res = await rq.put('').send({ message: '503 wtf' })
		expect(res.status).toBe(503)
		expect(res.body).toEqual({ status: 503, message: 'wtf' })

		// Priority on status property
		res = await rq.put('').send({ status: 422, message: '503 megawatts' })
		expect(res.status).toBe(422)
		// Don't clean message if status property
		expect(res.body).toEqual({ status: 422, message: '503 megawatts' })
	})

	test('infer from literal object', async () => {
		const res = await rq.patch('').send({ status: 403, message: '500 megawatts' })
		expect(res.status).toBe(403)
		expect(res.body).toEqual({ status: 403, message: '500 megawatts' })
	})

	test('infer from response status', async () => {
		const res = await rq.delete('').accept('json')
		expect(res.status).toBe(418)
		expect(res.body).toEqual({ message: '200' })
	})
})

describe('removable', () => {
	@Use(json())
	class Controller {
		@Get()
		get(req: Request, res: Response) {
			res.type('json')
			throw req.httpVersionMajor
		}

		@Post()
		post() {
			const err = Error('wtf') as any
			err.status = 418
			throw err
		}
	}

	const app = express()
	const rq = supertest(register(app, [Controller]))

	const afterHandler: RequestHandler = (req, res, next) => next()
	const errorHandler: ErrorRequestHandler = (err, req, res, next) => next(err)

	test('not removed by simple handler', async () => {
		expect(hasGlobalErrorHandler(app)).toBe(true)
		app.use((req, res, next) => next())
		app.use([afterHandler, afterHandler])
		expect(hasGlobalErrorHandler(app)).toBe(true)
	})

	test('removed by error handler', async () => {
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
