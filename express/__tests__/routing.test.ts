import supertest from 'supertest'
import express, { Response, Request, NextFunction } from 'express'
import { register, Router, Get, Post, Put, Patch, Method, Res, Req } from '../src'
import { log } from '../../testing/tools'

class UserService {
	private users = [
		{ id: '1', name: 'Jeremy' },
		{ id: '2', name: 'Julia' },
	]

	getUserById(id: string) {
		return this.users.find((user) => user.id === id)
	}
}

@Router('/user', { caseSensitive: true })
class UserController {
	constructor(private userService: UserService) {}

	@Get()
	get(@Res res: Response) {
		res.send([{ id: 1 }])
	}

	@Patch('/:id')
	patch(@Req() req: Request<{ id: string }>, @Res() res: Response) {
		const user = this.userService.getUserById(req.params.id)
		res.send(user)
	}

	@Post()
	@Put('/me')
	async post(req: Request, res: Response, next: NextFunction) {
		await new Promise((resolve) => setTimeout(resolve, 20))
		res.send({ id: 3 })
	}
}

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

const rq = supertest(
	register(express(), [
		new UserController(new UserService()),
		new MessageController(),
		/* will warn */ new UserService(),
	])
)

describe('With Router', () => {
	test('@Get', async () => {
		const res = await rq.get('/user')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Patch, params', async () => {
		const res = await rq.patch('/user/1')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: '1', name: 'Jeremy' })
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
