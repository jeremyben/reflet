import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Put } from '@reflet/express'
import { UseStatus } from '../src'
import { log } from '../../testing/tools'

@UseStatus(204)
class Controller {
	@Get()
	get(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.send('done')
	}

	@Put()
	put(req: express.Request, res: express.Response, next: express.NextFunction) {
		next(400)
	}
}

const rq = supertest(register(express(), [Controller]))

test('set success status', async () => {
	const res = await rq.get('')
	expect(res.status).toBe(204)
})

test('error status overwrite', async () => {
	const res = await rq.put('')
	// Status is inferred by global handler
	expect(res.status).toBe(400)
})
