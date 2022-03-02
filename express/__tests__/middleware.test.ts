import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Post, Put, Use, Catch, Router, Body } from '../src'
import { log } from '../../testing/tools'

@Catch(async (err, req, res, next) => res.status(418).send({ err }))
@Use(express.json())
@Router('/foo')
class FooRouter {
	@Use(
		(req: express.Request & { user?: any }, res, next) => {
			req.user = { id: 1, name: 'jeremy' }
			next()
		},
		(req: express.Request & { user?: any }, res, next) => {
			req.user.id = 2
			next()
		}
	)
	@Use((req: express.Request & { user?: any }, res, next) => {
		req.user.id = 3
		next()
	})
	@Get('/get')
	get(req: express.Request & { user: any }, res: express.Response) {
		res.send({ user: req.user })
	}

	@Catch((err, req, res, next) => {
		throw err + 1
	})
	@Put('/put')
	async put(@Body() body: any) {
		await new Promise((resolve) => setTimeout(resolve, 20))
		throw 1
	}

	@Post('/post')
	post(req: express.Request, res: express.Response) {
		res.send({ foo: req.body.foo * 2 })
	}
}

@Use(express.json())
@Router('/bar')
class BarRouter {
	@Post('/post')
	post(req: express.Request, res: express.Response) {
		res.send({ bar: req.body.bar * 2 })
	}
}

const rq = supertest(register(express(), [FooRouter, BarRouter]))

test('middleware order', async () => {
	const res = await rq.get('/foo/get')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ user: { id: 3, name: 'jeremy' } })
})

test('shared middleware (body-parser)', async () => {
	const res = await rq.post('/foo/post').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ foo: 10 })

	const res2 = await rq.post('/bar/post').send({ bar: 5 })
	expect(res2.status).toBe(200)
	expect(res2.body).toEqual({ bar: 10 })
})

test('error handlers', async () => {
	const res = await rq.put('/foo/put').send({ foo: 1 })
	expect(res.status).toBe(418)
	expect(res.body).toEqual({ err: 2 })
})
