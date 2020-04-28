import supertest from 'supertest'
import express, { Response, Request, NextFunction } from 'express'
import { register, Router, Get, Post, Put, Patch, Method, Res, Req, Use, Params, Body } from '../src'
import { log } from '../../testing/tools'

describe('basic routing', () => {
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

	const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

	const rq = supertest(
		register(express(), [
			new UserController(new UserService()),
			new MessageController(),
			/* will warn */ new UserService(),
		])
	)
	expect(consoleSpy).toBeCalledWith(expect.stringContaining('register'))
	consoleSpy.mockRestore()

	test('@Get with Router', async () => {
		const res = await rq.get('/user')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Patch with Router, route param and service dependency', async () => {
		const res = await rq.patch('/user/1')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: '1', name: 'Jeremy' })
	})

	test('@Post with Router, async', async () => {
		const res = await rq.post('/user')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 3 })
	})

	test('@Put with Router, caseSensitive option', async () => {
		await rq.put('/user/me').expect(200)
		await rq.put('/user/ME').expect(404)
	})

	test('@Get without Router', async () => {
		const res = await rq.options('/message')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Get without Router, with route param', async () => {
		const res = await rq.get('/message/2')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 2 })
	})
})

describe('children controllers', () => {
	test('simple registration', async () => {
		@Use((req, res, next) => {
			res.status(201)
			next()
		})
		@Router('/module')
		class Module {
			constructor() {
				Router.register(this, [Controller])
			}
		}

		@Router('/foo')
		class Controller {
			@Get()
			get(@Res res: Response) {
				res.send({})
			}
		}

		const app = register(express(), [Module])
		const rq = supertest(app)

		const resGet = await rq.get('/module/foo')
		expect(resGet.status).toBe(201)
	})

	test('passing down dependencies, shared params, jsonParser deduplication', async () => {
		class UserService {
			users = [
				{ name: 'jeremy', items: ['sword', 'hat'] },
				{ name: 'julia', items: ['book', 'shoe'] },
			]
		}

		@Use(express.json({ strict: false }))
		@Router('/module')
		class Module {
			constructor(service: UserService) {
				Router.register(this, [new UserController(service)])
			}
		}

		@Router('/user/:userId?', { mergeParams: true })
		class UserController {
			constructor(service: UserService) {
				Router.register(this, [new UserItemController(service)])
			}

			@Post()
			post(@Res res: Response, @Body() body: any) {
				res.send(body === null)
			}
		}

		@Router('/item/:itemId', { mergeParams: true })
		class UserItemController {
			constructor(private service: UserService) {}

			@Get()
			get(@Res res: Response, @Params { userId, itemId }: { userId: string; itemId: string }) {
				const userIndex = Number.parseInt(userId, 10)
				const itemIndex = Number.parseInt(itemId, 10)
				res.json(this.service.users[userIndex].items[itemIndex])
			}
		}

		const app = express()
		// app.use(express.json({ strict: false }))

		const rq = supertest(register(app, [new Module(new UserService())]))

		const resPost = await rq
			.post('/module/user')
			.set('Content-Type', 'application/json')
			.send(null as any)
		expect(resPost.body).toBe(true)

		const resGet = await rq.get('/module/user/1/item/0')
		expect(resGet.body).toEqual('book')
	})

	test('prevent registering on non-router', async () => {
		@Router('/bar')
		class Bar {
			@Get()
			get(@Res res: Response) {
				res.sendStatus(200)
			}
		}
		class Foo {
			constructor() {
				Router.register(this, [Bar])
			}

			@Get('/foo')
			get(@Res res: Response) {
				res.sendStatus(200)
			}
		}

		const app = express()

		expect(() => register(app, [Foo])).toThrowError(/@Router/)
	})
})
