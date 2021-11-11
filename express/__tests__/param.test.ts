import * as supertest from 'supertest'
import * as express from 'express'
import {
	register,
	Router,
	Get,
	Post,
	Put,
	Patch,
	Use,
	Res,
	Body,
	Params,
	Headers,
	Query,
	createParamDecorator,
} from '../src'
import { extractMiddlewares } from '../src/middleware-decorator'
import { extractParamsMiddlewares } from '../src/param-decorators'
import { getGlobalMiddlewares } from '../src/register'
import { log } from '../../testing/tools'

describe('basic decorators', () => {
	@Use((req, res, next) => {
		req.headers.via = 'via'
		req.headers.shared = 'shared'
		next()
	})
	@Router('')
	class FooRouter {
		@Get()
		async get(@Headers headers: any, @Headers('via') via: string, @Res res: express.Response) {
			res.send({ via, shared: headers.shared })
		}

		@Post()
		post(@Body body: { foo: number }, @Body<{ foo: number }>('foo') foo: number, @Res res: express.Response) {
			res.send({ bar: foo * body.foo })
		}

		@Patch('/:id')
		patch(@Params params: any, @Query queries: any, @Res res: express.Response) {
			const bar = Number.parseInt(params.id, 10) * 2
			res.send({ bar, baz: queries.q })
		}

		@Put('/:id')
		put(@Params('id') id: string, @Query('q') q: string, @Res res: express.Response) {
			const bar = Number.parseInt(id, 10) * 2
			res.send({ bar, baz: q })
		}
	}

	const rq = supertest(register(express(), [FooRouter]))

	test('@Headers', async () => {
		const res = await rq.get('')
		expect(res.body).toEqual({ via: 'via', shared: 'shared' })
	})

	test('@Body with auto body-parser', async () => {
		const res = await rq.post('').send({ foo: 5 })
		expect(res.body).toEqual({ bar: 25 })
	})

	test('@Params and @Query objects', async () => {
		const res = await rq.patch('/25?q=yes')
		expect(res.body).toEqual({ bar: 50, baz: 'yes' })
	})

	test('@Params and @Query subkeys', async () => {
		const res = await rq.put('/25?q=yes')
		expect(res.body).toEqual({ bar: 50, baz: 'yes' })
	})
})

describe('custom decorators', () => {
	const CurrentUser = createParamDecorator((req: express.Request & { user?: any }) => req.user)
	const BodyTrimmed = (subKey: string) => createParamDecorator((req) => req.body[subKey].trim(), [express.json()])

	@Use((req: express.Request & { user?: any }, res, next) => {
		req.user = { id: 1, name: 'jeremy' }
		next()
	})
	@Router('')
	class FooRouter {
		@Get()
		get(@CurrentUser user: object, @Res res: express.Response) {
			res.send({ user })
		}

		@Put()
		put(@BodyTrimmed('foot') foot: string, @BodyTrimmed('pub') pub: string, @Res res: express.Response) {
			foot = foot + '!'
			pub = pub + '!'
			res.send({ foot, pub })
		}
	}

	const rq = supertest(register(express(), [FooRouter]))

	test('simple decorator', async () => {
		const res = await rq.get('')
		expect(res.body).toEqual({
			user: { id: 1, name: 'jeremy' },
		})
	})

	test('decorator with options and middleware', async () => {
		const res = await rq.put('').send({ foot: ' Champions du monde  ', pub: '  O Ballec  ' })
		expect(res.body).toEqual({
			foot: 'Champions du monde!',
			pub: 'O Ballec!',
		})
	})
})

describe('param middlewares deduplication', () => {
	test('body-parsers on the route', async () => {
		@Use(express.json(), express.urlencoded({ extended: false }))
		class Foo {
			@Use(express.json())
			@Post()
			post(@Body('foo') foo: string, @Body body: any, @Res res: express.Response) {
				res.send(foo)
			}
		}

		const sharedMwares = extractMiddlewares(Foo)
		const routeMwares = extractMiddlewares(Foo, 'post')
		const paramMwares = extractParamsMiddlewares(Foo, 'post', [sharedMwares, routeMwares])

		expect(paramMwares).toHaveLength(0)
	})

	test('body-parsers in different param decorators', async () => {
		const BodyTrimmed = (subKey: string) =>
			createParamDecorator((req) => req.body[subKey].trim(), [{ handler: express.json(), dedupe: 'by-name' }])

		class Foo {
			@Post()
			post(@BodyTrimmed('foo') fooTrimmed: string, @Body('foo') foo: string, @Res res: express.Response) {
				res.send(fooTrimmed)
			}
		}

		const sharedMwares = extractMiddlewares(Foo)
		const routeMwares = extractMiddlewares(Foo, 'post')
		const paramMwares = extractParamsMiddlewares(Foo, 'post', [sharedMwares, routeMwares])

		// Won't dedupe
		expect(paramMwares).toHaveLength(3)
	})

	test('custom middleware', async () => {
		type User = { id: number; name: string }
		type RequestAuth = express.Request & { user?: User }

		const authent: express.RequestHandler = (req: RequestAuth, res, next) => {
			req.user = { id: 1, name: 'jeremy' }
			next()
		}

		const CurrentUser = createParamDecorator((req: RequestAuth) => req.user!, [{ handler: authent, dedupe: true }])

		@Use(authent)
		class Bar {
			@Post('user/:yo')
			post(@CurrentUser user: User, @Res res: express.Response) {
				res.send(user)
			}
		}
		const app = express()
		app.use(authent)
		const globalMwares = getGlobalMiddlewares(app)
		const sharedMwares = extractMiddlewares(Bar)
		const routeMwares = extractMiddlewares(Bar, 'post')
		const paramMwares = extractParamsMiddlewares(Bar, 'post', [globalMwares, sharedMwares, routeMwares])

		expect(sharedMwares.some((m) => globalMwares.includes(m))).toBe(true)
		expect(paramMwares).toHaveLength(0)
	})
})

test('only one decorator', () => {
	const QueryBool = (subKey: string) => createParamDecorator((req) => Boolean(req.query[subKey]))

	expect(() => {
		class Foo {
			@Get()
			get(@QueryBool('ok') @Query('ok') ok: boolean) {}
		}
	}).toThrowError()
})
