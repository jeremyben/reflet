import supertest from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import { register, Get, Post } from '@reflet/express'
import { UseGuards } from '../src'
import { log } from '../../testing/tools'

class Controller {
	@UseGuards(async (req) => req.method === 'GET')
	@UseGuards((req) => true, (req) => req.headers.via === 'jest')
	@Get()
	get(req: Request, res: Response, next: NextFunction) {
		res.send('hi')
	}

	@UseGuards(async (req) => (req as any).admin || Error('You must be admin'))
	@Post()
	post(req: Request, res: Response, next: NextFunction) {
		res.send('hi')
	}
}

const rq = supertest(register(express(), [Controller]))

test('pass guards', async () => {
	const res = await rq.get('').set('via', 'jest')
	expect(res.status).toBe(200)
})

test("don't pass guards", async () => {
	const res = await rq.get('')
	expect(res.status).toBe(403)
	expect(res.text).toContain('Error: Access Denied')
})

test('custom html 403 message', async () => {
	const res = await rq.post('')
	expect(res.status).toBe(403)
	expect(res.text).toContain('Error: You must be admin')
})

test('custom json 403 message', async () => {
	const res = await rq.post('').accept('application/json')
	// content-type should be inferred by our global error handler
	expect(res.status).toBe(403)
	expect(res.body).toEqual({ message: 'You must be admin', status: 403 })
})
