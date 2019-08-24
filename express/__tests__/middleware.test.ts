import supertest from 'supertest'
import express, { json, Response, NextFunction, Request } from 'express'
import { register, Get, Post, Put, Patch, Use, UseBefore, UseCatch, UseAfter } from '../src'
import { log } from '../../testing/tools'

@Use(json())
class FooTestController {
	@UseBefore(
		(req: Request & { user?: any }, res, next) => {
			req.user = { id: 1, name: 'jeremy' }
			next()
		},
		(req: Request & { user?: any }, res, next) => {
			req.user.id = 2
			next()
		}
	)
	@Get()
	get(req: Request & { user: any }, res: Response, next: NextFunction) {
		res.send({ user: req.user })
	}

	@Post()
	post(req: Request, res: Response, next: NextFunction) {
		res.send({ bar: req.body.foo * 2 })
	}

	@UseAfter((req, res, next) => {
		res.send('ok')
	})
	@Patch()
	patch(req: Request, res: Response, next: NextFunction) {
		next()
	}

	@UseCatch((err, req, res, next) => {
		res.status(418).send({ err })
	})
	@Put()
	async put(req: Request, res: Response, next: NextFunction) {
		await new Promise((resolve) => setTimeout(resolve, 20))
		throw req.httpVersionMajor
	}
}

const app = express()
const rq = supertest(app)
register(app, [FooTestController])

test('route middleware', async () => {
	const res = await rq.get('')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ user: { id: 2, name: 'jeremy' } })
})

test('shared middleware (body-parser)', async () => {
	const res = await rq.post('').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 10 })
})

test('async error handler', async () => {
	const res = await rq.put('')
	expect(res.status).toBe(418)
	expect(res.body).toEqual({ err: 1 })
})

test('after middleware', async () => {
	const res = await rq.patch('')
	expect(res.status).toBe(200)
	expect(res.text).toEqual('ok')
})
