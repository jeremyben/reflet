import { IncomingHttpHeaders } from 'http'
import { performance } from 'perf_hooks'
import supertest from 'supertest'
import express, { Response, Request, NextFunction } from 'express'
import { register, Router, Get, Post, Put, Patch, Use, UseCatch, Req, Res, Body, Params, Headers } from './'

@Use((req, res, next) => {
	req.headers.shared = 'shared'
	next()
})
@Router('/user')
class TestRouter {
	@Use((req, res, next) => {
		req.headers.route = 'route'
		next()
	})
	@Get()
	async getOne(@Res res: Response, @Headers headers: IncomingHttpHeaders) {
		const { shared, route } = headers
		res.send({ shared, route })
	}

	@UseCatch((err, req, res, next) => res.send({ err }))
	@Put('/:id')
	async putOne(@Params params: any) {
		await new Promise((resolve) => setTimeout(resolve, 20))

		const id = Number.parseInt(params.id, 10)
		throw id * 2
	}

	@Post()
	postOne(req: Request, res: Response, next: NextFunction) {
		res.send('ok')
	}

	@Patch('/:id')
	patchOne(@Res() res: Response, @Body<{ foo: number }>('foo') foo: number) {
		res.send({ bar: foo * 2 })
	}
}

const app = express()
const rq = supertest(app)

const t1 = performance.now()
register(app, [TestRouter])
console.info(`register in ${(performance.now() - t1).toFixed(4)} ms`)

test('shared and route middlewares, use of @Headers', async () => {
	const res = await rq.get('/user')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ route: 'route', shared: 'shared' })
})

test('async error handler, use of @Param', async () => {
	const res = await rq.put('/user/25').send({ foo: 1 })
	expect(res.body).toEqual({ err: 50 })
})

test('use of @Body with auto body-parser', async () => {
	const res = await rq.patch('/user/25').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 10 })
})
