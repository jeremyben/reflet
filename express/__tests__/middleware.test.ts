import supertest from 'supertest'
import express, { json, Response, NextFunction, Request } from 'express'
import { register, Get, Post, Put, Use, Catch, Router } from '../src'
import { log } from '../../testing/tools'

@Catch((err, req, res, next) => res.status(418).send({ err }))
@Use(json())
@Router('')
class FooController {
	@Use(
		(req: Request & { user?: any }, res, next) => {
			req.user = { id: 1, name: 'jeremy' }
			next()
		},
		(req: Request & { user?: any }, res, next) => {
			req.user.id = 2
			next()
		}
	)
	@Use((req: Request & { user?: any }, res, next) => {
		req.user.id = 3
		next()
	})
	@Get()
	get(req: Request & { user: any }, res: Response) {
		res.send({ user: req.user })
	}

	@Post()
	post(req: Request, res: Response) {
		res.send({ bar: req.body.foo * 2 })
	}

	@Catch((err, req, res, next) => next(err + 1))
	@Put()
	async put() {
		await new Promise((resolve) => setTimeout(resolve, 20))
		throw 1
	}
}

const rq = supertest(register(express(), [FooController]))

test('middleware order', async () => {
	const res = await rq.get('')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ user: { id: 3, name: 'jeremy' } })
})

test('shared middleware (body-parser)', async () => {
	const res = await rq.post('').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 10 })
})

test('error handlers', async () => {
	const res = await rq.put('')
	expect(res.status).toBe(418)
	expect(res.body).toEqual({ err: 2 })
})
