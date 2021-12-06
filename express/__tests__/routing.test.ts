import * as supertest from 'supertest'
import * as express from 'express'
import { register, Router, Get, Post, Patch, Route, Res, Req, Use, Params, Body } from '../src'
import { RefletExpressError } from '../src/reflet-error'
import { log } from '../../testing/tools'

describe('basic routing', () => {
	const PostAndPut = (path: string | RegExp) => Route(['post', 'put'], path)

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
	class UserRouter {
		constructor(private userService: UserService) {}

		@Get()
		get(@Res res: Res) {
			res.send([{ id: 1 }])
		}

		@Patch('/:id')
		patch(@Req() req: Req<{ id: string }>, @Res() res: Res) {
			const user = this.userService.getUserById(req.params.id)
			res.send(user)
		}

		@PostAndPut('/me')
		async post(req: express.Request, res: express.Response, next: express.NextFunction) {
			await new Promise((resolve) => setTimeout(resolve, 20))
			res.send({ id: 3 })
		}
	}

	@Router('/message')
	class MessageRouter {
		prop = 1

		@Route('options', '')
		options = (req: express.Request, res: express.Response, next: express.NextFunction) => {
			res.send([{ id: this.prop }])
		}

		@Route.Get('/:id')
		get(@Res res: Res, @Req req: Req) {
			const id = Number.parseInt(req.params.id, 10)
			res.send({ id })
		}
	}

	const rq = supertest(register(express(), [new UserRouter(new UserService()), new MessageRouter()]))

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

	test('Options verb, property instead of function', async () => {
		const res = await rq.options('/message')
		expect(res.status).toBe(200)
		expect(res.body).toEqual([{ id: 1 }])
	})

	test('@Get with route param', async () => {
		const res = await rq.get('/message/2')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ id: 2 })
	})
})

describe('children routers', () => {
	test('simple registration', async () => {
		@Use((req, res, next) => {
			res.status(201)
			next()
		})
		@Router('/module')
		@Router.Children(() => [FooRouter])
		class Module {}

		@Router('/foo')
		class FooRouter {
			@Get()
			get(@Res res: Res) {
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
		@Router.Children<typeof AppModule>((service) => [new UserRouter(service)])
		@Router('/module')
		class AppModule {
			constructor(private service: UserService) {}
		}

		@Router('/user/:userId?', { mergeParams: true })
		@Router.Children<typeof UserRouter>((service) => [['/item/:itemId', new UserItemRouter(service)]])
		class UserRouter {
			constructor(private service: UserService) {}

			@Post()
			post(@Res res: Res, @Body() body: any) {
				res.send(body === null)
			}
		}

		@Router('/item/:itemId', { mergeParams: true })
		class UserItemRouter {
			constructor(private service: UserService) {}

			@Get()
			get(@Res res: Res, @Params { userId, itemId }: Params<'userId' | 'itemId'>) {
				const userIndex = Number.parseInt(userId, 10)
				const itemIndex = Number.parseInt(itemId, 10)
				res.json(this.service.users[userIndex].items[itemIndex])
			}
		}

		const app = express()
		// app.use(express.json({ strict: false }))
		const appModule = new AppModule(new UserService())
		const rq = supertest(register(app, [appModule]))

		const resPost = await rq
			.post('/module/user')
			.set('Content-Type', 'application/json')
			.send(null as any)
		expect(resPost.status).toBe(200)
		expect(resPost.body).toBe(true)

		const resGet = await rq.get('/module/user/1/item/0')
		expect(resGet.body).toEqual('book')
	})

	test('prevent registering on non-router', async () => {
		@Router('/bar')
		class Bar {
			@Get()
			get(@Res res: Res) {
				res.sendStatus(200)
			}
		}

		@Router.Children(() => [Bar])
		class Foo {
			@Get('/foo')
			get(@Res res: Res) {
				res.sendStatus(200)
			}
		}

		const app = express()

		expect(() => register(app, [Foo])).toThrow(
			expect.objectContaining({ code: <RefletExpressError['code']>'ROUTER_DECORATOR_MISSING' })
		)
	})
})

// tslint:disable: no-empty
describe('constrain with path-router tuples', () => {
	test('happy path', () => {
		@Router('/foo')
		@Router.Children(() => [['/bar', Bar]])
		class Foo {
			@Get()
			get() {}
		}

		@Router('/bar')
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [['/foo', new Foo()]])).not.toThrow()
	})

	test('wrong string', () => {
		@Router('f')
		class Foo {
			@Get()
			get() {}
		}

		expect(() => register(express(), [['foo', Foo]])).toThrow(/expects "foo"/)
	})

	test('wrong regex', () => {
		@Router(/f/)
		class Foo {
			@Get()
			get() {}
		}

		expect(() => register(express(), [[/foo/, Foo]])).toThrow(/expects "\/foo\/"/)
	})

	test('wrong type', () => {
		@Router(/bar/)
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [['bar', Bar]])).toThrow(/expects string/)

		@Router('/baz')
		class Baz {
			@Get()
			get() {}
		}

		expect(() => register(express(), [[/baz/, Baz]])).toThrow(/expects regex/)
	})

	test('wrong type', () => {
		@Router(/bar/)
		class Bar {
			@Get()
			get() {}
		}

		expect(() => register(express(), [['bar', Bar]])).toThrow(/expects string/)

		@Router('/baz')
		class Baz {
			@Get()
			get() {}
		}

		expect(() => register(express(), [[/baz/, Baz]])).toThrow(/expects regex/)
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
		@Router.Children(() => [
			['/child1', plainRouter],
			['/child2', plainRouter],
		])
		class Foo {}

		const app = register(express(), [
			['/foo', Foo],
			['/bar', plainRouter],
		])

		const rq = supertest(app)

		expect((await rq.get('/foo/child1')).status).toBe(201)
		expect((await rq.get('/foo/child2')).status).toBe(201)
		expect((await rq.get('/bar')).status).toBe(200)
	})

	test('dynamic router', async () => {
		@Router('/foo')
		@Router.Children(() => [['/items', Items]])
		class Foo {}

		@Use((req, res, next) => {
			res.status(201)
			next()
		})
		@Router('/bar')
		@Router.Children(() => [['/elements', Items]])
		class Bar {}

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
		@Router.Children(() => [Items])
		class Foo {}

		expect(() => register(express(), [Foo])).toThrow(
			expect.objectContaining({ code: <RefletExpressError['code']>'DYNAMIC_ROUTER_PATH_UNDEFINED' })
		)
	})
})
// tslint:enable: no-empty

test('route function constraint', async () => {
	@Router('/foo')
	class Foo {
		@Get()
		prop = 'foo'
	}

	expect(() => register(express(), [Foo])).toThrow(
		expect.objectContaining({ code: <RefletExpressError['code']>'INVALID_ROUTE_TYPE' })
	)
})
