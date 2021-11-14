import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Put, Router } from '@reflet/express'
import { UseResponseHeader, UseType } from '../src'
import { log } from '../../testing/tools'

@UseResponseHeader({ 'x-powered-by': 'brainfuck', via: 'jest' })
@Router('/')
class Controller {
	@UseResponseHeader('allow', 'GET')
	@Get()
	get(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.sendStatus(406)
	}

	@UseType('json')
	@Put()
	put(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.json('done')
	}
}

const rq = supertest(register(express(), [Controller]))

test('set response header', async () => {
	const res = await rq.get('/')
	expect(res.header.allow).toBe('GET')
	expect(res.header['x-powered-by']).toBe('brainfuck')
	expect(res.header.via).toBe('jest')
})

test('set response content-type', async () => {
	const res = await rq.put('/')
	expect(res.type).toBe('application/json')
	expect(res.header.via).toBe('jest')
})
