import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Post, Router } from '@reflet/express'
import { UseGuards } from '../src'
import { log } from '../../testing/tools'

@Router('/')
class Controller {
	@UseGuards(async (req) => req.method === 'GET')
	@UseGuards((req) => true, (req) => req.headers.via === 'jest')
	@Get()
	get(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.send('hi')
	}

	@UseGuards(async (req) => (req as any).admin || Error('You must be admin'))
	@Post()
	post(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.send('hi')
	}
}

const rq = supertest(register(express(), [Controller]))

test('pass guards', async () => {
	const res = await rq.get('/').set('via', 'jest')
	expect(res.status).toBe(200)
})

test("don't pass guards", async () => {
	const res = await rq.get('/')
	expect(res.status).toBe(403)
	expect(res.text).toContain('Forbidden: Access Denied')
})

test('custom html 403 message', async () => {
	const res = await rq.post('/')
	expect(res.status).toBe(403)
	expect(res.text).toContain('Error: You must be admin')
})
