import supertest from 'supertest'
import express, { Response, Request, NextFunction } from 'express'
import { register, Router, Get, Post, Put, Patch, Method, Res, Req } from '../src'
import { log } from '../../testing/tools'

// With Router
@Router('/user', { caseSensitive: true })
class UserController {
	@Get()
	get(@Res res: Response) {
		res.send([{ id: 1 }])
	}

	@Patch('/:id')
	patch(@Req() req: Request, @Res() res: Response) {
		const id = Number.parseInt(req.params.id, 10)
		res.send({ id })
	}

	@Post()
	@Put('/me')
	async post(req: Request, res: Response, next: NextFunction) {
		await new Promise((resolve) => setTimeout(resolve, 20))
		res.send({ id: 3 })
	}
}

// Without Router
class MessageController {
	prop = 1

	@Method('options', '/message')
	options(req: Request, res: Response, next: NextFunction) {
		res.send([{ id: this.prop }])
	}

	@Get('/message/:id')
	get(@Res res: Response, @Req req: Request) {
		const id = Number.parseInt(req.params.id, 10)
		res.send({ id })
	}
}

// No routes
class UserService {
	get(id: string) {
		return { id, name: 'Jeremy' }
	}
}

const rq = supertest(register(express(), [UserController, MessageController, UserService]))

describe('With Router', () => {
	test('@Get', async () => {
		const res = await rq.get('/user')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Patch, params', async () => {
		const res = await rq.patch('/user/2')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 2 })
	})

	test('@Post, async', async () => {
		const res = await rq.post('/user')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 3 })
	})

	test('@Put, router option', async () => {
		await rq.put('/user/me').expect(200)
		await rq.put('/user/ME').expect(404)
	})
})

describe('Without Router', () => {
	test('@Get', async () => {
		const res = await rq.options('/message')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Get params', async () => {
		const res = await rq.get('/message/2')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 2 })
	})
})
