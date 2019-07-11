import supertest from 'supertest'
import express, { Response, Request, NextFunction, json, urlencoded } from 'express'
import { register, Router, Get, Post, Put, Patch, Use, UseCatch, Req, Res, Body, Params, Headers } from './'

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
	@Put('/:id')
	async putOne(@Params params: any) {
		await new Promise((resolve) => setTimeout(resolve, 20))

		const id = Number.parseInt(params.id, 10)
		throw id * 2
	}

	@Post()
	postOne(req: Request, res: Response, next: NextFunction) {
		res.status(200).send(req.body)
	}

	@Patch('/:id')
	patchOne(@Res res: Response, @Body<{ foo: number }>('foo') foo: number) {
		res.status(200).send({ bar: foo * 2 })
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

test('async error handler and use of @Param', async () => {
	const res = await rq.put('/user/25').send({ foo: 1 })
	expect(res.body).toEqual({ err: 50 })
})

test('Use of @Body', async () => {
	const res = await rq.patch('/user/25').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 10 })
})
