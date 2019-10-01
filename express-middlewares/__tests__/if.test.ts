import supertest from 'supertest'
import express, { json, urlencoded, Request, Response, NextFunction } from 'express'
import { register, Post, Put } from '@reflet/express'
import { UseIf } from '../src'
import { log } from '../../testing/tools'

@UseIf((req) => req.method === 'POST', [json()])
@UseIf(async (req) => req.method === 'PUT', [urlencoded({ extended: true })])
class Controller {
	@Post()
	post(req: Request, res: Response, next: NextFunction) {
		res.json(req.body)
	}

	@Put()
	put(req: Request, res: Response, next: NextFunction) {
		res.json(req.body)
	}
}

const rq = supertest(register(express(), [Controller]))

test('condition pass', async () => {
	const res = await rq.post('').send({ foo: 1 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ foo: 1 })
})

test("condition doesn't pass", async () => {
	const res = await rq.put('').send({ foo: 1 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({})
})

test('async condition pass', async () => {
	const res = await rq.put('').send('foo=1')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ foo: '1' })
})