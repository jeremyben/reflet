import * as supertest from 'supertest'
import * as express from 'express'
import { register, Router, Get, Post, Patch, Method, Res, Req, Use, Params, Body } from '../src'
import { log } from '../../testing/tools'

describe('basic routing', () => {
	const PostAndPut = (path: string | RegExp) => Method(['post', 'put'], path)

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
		get(@Res res: express.Response) {
			res.send([{ id: 1 }])
		}

		@Patch('/:id')
		patch(@Req() req: express.Request<{ id: string }>, @Res() res: express.Response) {
			const user = this.userService.getUserById(req.params.id)
			res.send(user)
		}

		@PostAndPut('/me')
		async post(req: express.Request, res: express.Response, next: express.NextFunction) {
			await new Promise((resolve) => setTimeout(resolve, 20))
			res.send({ id: 3 })
		}
	}

	class MessageController {
		prop = 1

		@Method('options', '/message')
		options = (req: express.Request, res: express.Response, next: express.NextFunction) => {
			res.send([{ id: this.prop }])
		}

		@Method.Get('/message/:id')
		get(@Res res: express.Response, @Req req: express.Request) {
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

	test('multipe verbs with Router, async, caseSensitive option', async () => {
		const res = await rq.post('/user/me')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 3 })
		await rq.put('/user/me').expect(200)
		await rq.put('/user/ME').expect(404)
	})

	test('Options verb without Router, property instead of function', async () => {
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
				register(this, [Controller])
			}
		}

		@Router('/foo')
		class Controller {
			@Get()
			get(@Res res: express.Response) {
				res.send({})
			}
		}

		const app = register(express(), [Module])
		const rq = supertest(app)

		const fooGet = await rq.get('/module/foo')
		expect(fooGet.status).toBe(201)
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
				register(this, [new UserController(service)])
			}
		}

		@Router('/user/:userId?', { mergeParams: true })
		class UserController {
			constructor(service: UserService) {
				register(this, [new UserItemController(service)])
			}

			@Post()
			post(@Res res: express.Response, @Body() body: any) {
				res.send(body === null)
			}
		}

		@Router('/item/:itemId', { mergeParams: true })
		class UserItemController {
			constructor(private service: UserService) {}

			@Get()
			get(@Res res: express.Response, @Params { userId, itemId }: { userId: string; itemId: string }) {
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
			get(@Res res: express.Response) {
				res.sendStatus(200)
			}
		}

		class Foo {
			constructor() {
				register(this, [Bar])
			}

			@Get('/foo')
			get(@Res res: express.Response) {
				res.sendStatus(200)
			}
		}

		const app = express()

		expect(() => register(app, [Foo])).toThrowError(/@Router/)
	})
})

// tslint:disable: no-empty
describe('constrain with path-router objects', () => {
	test('happy path', () => {
		@Router('/foo')
		class Foo {
			constructor() {
				register(this, [{ path: '/bar', router: Bar }])
			}

			@Get()
			get() {}
		}

		@Router('/bar')
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: '/foo', router: new Foo() }])).not.toThrow()
	})

	test('missing decorator', () => {
		class Foo {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: 'foo', router: Foo }])).toThrow(/constrained.*"foo".*decorated/)
	})

	test('wrong string', () => {
		@Router('f')
		class Foo {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: 'foo', router: Foo }])).toThrow(/expects "foo"/)
	})

	test('wrong regex', () => {
		@Router(/f/)
		class Foo {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: /foo/, router: Foo }])).toThrow(/expects "\/foo\/"/)
	})

	test('wrong type', () => {
		@Router(/bar/)
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: 'bar', router: Bar }])).toThrow(/expects string/)

		@Router('/baz')
		class Baz {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: /baz/, router: Baz }])).toThrow(/expects regex/)
	})

	test('wrong type', () => {
		@Router(/bar/)
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: 'bar', router: Bar }])).toThrow(/expects string/)

		@Router('/baz')
		class Baz {
			@Get()
			get() {}
		}

		expect(() => register(express(), [{ path: /baz/, router: Baz }])).toThrow(/expects regex/)
	})

	test('attach plain express routers', async () => {
		const plainRouter = express.Router().get('', (req, res, next) => {
			res.send({})
		})

		@Use((req, res, next) => {
			res.status(201)
			next()
		})
		@Router('/foo')
		class Foo {
			constructor() {
				register(this, [{ path: '/child1', router: plainRouter }])
				register(this, [['/child2', plainRouter] as object])
			}
		}

		const app = register(express(), [
			{ path: '/foo', router: Foo },
			{ path: '/bar', router: plainRouter },
		])

		const rq = supertest(app)

		expect((await rq.get('/foo/child1')).status).toBe(201)
		expect((await rq.get('/foo/child2')).status).toBe(201)
		expect((await rq.get('/bar')).status).toBe(200)
	})

	test('dynamic router', async () => {
		@Router('/foo')
		class Foo {
			constructor() {
				register(this, [{ path: '/items', router: Items }])
			}
		}

		@Use((req, res, next) => {
			res.status(201)
			next()
		})
		@Router('/bar')
		class Bar {
			constructor() {
				register(this, [{ path: '/elements', router: Items }])
			}
		}

		@Router.Dynamic()
		class Items {
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send(req.originalUrl)
			}
		}

		const rq = supertest(register(express(), [Foo, Bar]))

		const fooRes = await rq.get('/foo/items')
		expect(fooRes.status).toBe(200)
		expect(fooRes.text).toBe('/foo/items')

		const barRes = await rq.get('/bar/elements')
		expect(barRes.status).toBe(201)
		expect(barRes.text).toBe('/bar/elements')
	})

	test('dynamic router path not declared', async () => {
		@Router.Dynamic()
		class Items {
			@Get()
			get(req: express.Request, res: express.Response) {
				res.send(req.originalUrl)
			}
		}

		@Router('/foo')
		class Foo {
			constructor() {
				register(this, [Items])
			}
		}

		expect(() => register(express(), [Foo])).toThrow(/dynamic/)
	})
})
// tslint:enable: no-empty

test('route function constraint', async () => {
	@Router('/foo')
	class Foo {
		@Get()
		prop = 'foo'
	}

	expect(() => register(express(), [Foo])).toThrow(/function/)
})
