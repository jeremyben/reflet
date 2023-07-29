import * as supertest from 'supertest'
import * as express from 'express'
import { register, Get, Put, Router } from '@reflet/express'
import { UseStatus } from '../src'
import { log } from '../../testing/tools'

@UseStatus(204)
@Router('/')
class Controller {
	@Get()
	get(req: express.Request, res: express.Response, next: express.NextFunction) {
		res.send('done')
	}

	@Put()
	put(req: express.Request, res: express.Response, next: express.NextFunction) {
		const err = Error() as any
		err.status = 418
		next(err)
	}
}

const rq = supertest(register(express(), [Controller]))

test('set success status', async () => {
	const res = await rq.get('/')
	expect(res.status).toBe(204)
})

test('error status overwrite', async () => {
	const res = await rq.put('/')
	expect(res.status).toBe(418)
})
