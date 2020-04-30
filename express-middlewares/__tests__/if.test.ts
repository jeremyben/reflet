import * as supertest from 'supertest'
import * as express from 'express'
import { register, Post, Put } from '@reflet/express'
import { UseIf } from '../src'
import { log } from '../../testing/tools'

@UseIf((req) => req.method === 'POST', [express.json()])
@UseIf(async (req) => req.method === 'PUT', [express.urlencoded({ extended: true })])
class Controller {
	@Post()
	post(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.json(req.body)
	}

	@Put()
	put(req: express.Request, res: express.Response, next: express.NextFunction) {
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
