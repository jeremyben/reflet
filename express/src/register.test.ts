import supertest from 'supertest'
import express, { Response, Request, NextFunction, json, urlencoded } from 'express'
import { Get, Use, Post, Router, Put, UseCatch, Req, Res, Body, Patch, register } from './'

@Use(json(), urlencoded({ extended: true }))
@Router('/user')
class TestRouter {
	@Use((req, res, next) => {
		req.headers.via = 'foo'
		next()
	})
	@Get()
	async getOne(req: Request, res: Response, next: NextFunction) {
		res.status(200).send(req.headers.via)
	}

	@UseCatch((err, req, res, next) => {
		res.send({ err })
	})
	@Put()
	async putOne(req: Request, res: Response, next: NextFunction) {
		await new Promise((resolve) => setTimeout(resolve, 50))
		throw 13
	}

	@Post()
	postOne(req: Request, res: Response, next: NextFunction) {
		res.status(200).send(req.body)
	}

	@Patch()
	patchOne(@Res() res: Response, @Body<{ foo: number }>('foo') foo: number) {
		res.status(200).send({ bar: foo * 3 })
	}
}

const app = express()
const rq = supertest(app)
register(app, [TestRouter])

test('route middleware', async () => {
	const res = await rq.get('/user')
	expect(res.status).toBe(200)
	expect(res.text).toBe('foo')
})

test('shared middleware (json parser)', async () => {
	const res = await rq.post('/user').send({ foo: 1 })
	expect(res.body).toEqual({ foo: 1 })
})

test('async error handler', async () => {
	const res = await rq.put('/user').send({ foo: 1 })
	expect(res.body).toEqual({ err: 13 })
})

test('route params', async () => {
	const res = await rq.patch('/user').send({ foo: 3 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 9 })
})
