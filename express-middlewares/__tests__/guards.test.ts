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

test('rejected guard is forwarded to error handlers', async () => {
	@Router('/rejected-guard')
	class RejectedGuard {
		@UseGuards(async () => {
			throw Error('guard')
		})
		@Get()
		get(req: express.Request, res: express.Response) {
			res.send('secret')
		}
	}

	const app = register(express(), [RejectedGuard])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)

	const res = await supertest(app).get('/rejected-guard')
	expect(res.status).toBe(500)
	expect(res.text).toBe('guard')
})

test('guard rejected without reason does not authorize', async () => {
	@Router('/falsy-guard')
	class FalsyGuard {
		@UseGuards(() => Promise.reject())
		@Get()
		get(req: express.Request, res: express.Response) {
			res.send('secret')
		}
	}

	const app = register(express(), [FalsyGuard])
	app.use(((err, req, res, next) => res.status(500).send(err.message)) as express.ErrorRequestHandler)

	const res = await supertest(app).get('/falsy-guard')
	expect(res.status).toBe(500)
	expect(res.text).toBe('Rejected promise')
})
