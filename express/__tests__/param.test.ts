import supertest from 'supertest'
import express, { Response, Request, RequestHandler, json, urlencoded } from 'express'
import {
	register,
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
	class Controller {
		@Get()
		async get(@Headers headers: any, @Headers('via') via: string, @Res res: Response) {
			res.send({ via, shared: headers.shared })
		}

		@Post()
		post(@Body body: { foo: number }, @Body<{ foo: number }>('foo') foo: number, @Res res: Response) {
			res.send({ bar: foo * body.foo })
		}

		@Patch('/:id')
		patch(@Params params: any, @Query queries: any, @Res res: Response) {
			const bar = Number.parseInt(params.id, 10) * 2
			res.send({ bar, baz: queries.q })
		}

		@Put('/:id')
		put(@Params('id') id: string, @Query('q') q: string, @Res res: Response) {
			const bar = Number.parseInt(id, 10) * 2
			res.send({ bar, baz: q })
		}
	}

	const rq = supertest(register(express(), [Controller]))

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
	const CurrentUser = createParamDecorator((req: Request & { user?: any }) => req.user)
	const BodyTrimmed = (subKey: string) => createParamDecorator((req) => req.body[subKey].trim(), [json()])

	@Use((req: Request & { user?: any }, res, next) => {
		req.user = { id: 1, name: 'jeremy' }
		next()
	})
	class Controller {
		@Get()
		get(@CurrentUser user: object, @Res res: Response) {
			res.send({ user })
		}

		@Put()
		put(@BodyTrimmed('foot') foot: string, @BodyTrimmed('pub') pub: string, @Res res: Response) {
			foot = foot + '!'
			pub = pub + '!'
			res.send({ foot, pub })
		}
	}

	const rq = supertest(register(express(), [Controller]))

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
		@Use(json(), urlencoded({ extended: false }))
		class Foo {
			@Use(json())
			@Post()
			post(@Body('foo') foo: string, @Body body: any, @Res res: Response) {
				res.send(foo)
			}
		}

		const sharedMwares = extractMiddlewares(Foo)
		const routeMwares = extractMiddlewares(Foo, 'post')
		const paramMwares = extractParamsMiddlewares(Foo, 'post', [[], sharedMwares, routeMwares])

		expect(paramMwares).toHaveLength(0)
	})

	test('body-parsers in different param decorators', async () => {
		const BodyTrimmed = (subKey: string) =>
			createParamDecorator((req) => req.body[subKey].trim(), [json()], true)

		class Foo {
			@Post()
			post(@BodyTrimmed('foo') fooTrimmed: string, @Body('foo') foo: string, @Res res: Response) {
				res.send(fooTrimmed)
			}
		}

		const sharedMwares = extractMiddlewares(Foo)
		const routeMwares = extractMiddlewares(Foo, 'post')
		const paramMwares = extractParamsMiddlewares(Foo, 'post', [[], sharedMwares, routeMwares])

		// Won't dedupe
		expect(paramMwares).toHaveLength(3)
	})

	test('custom middleware', async () => {
		type User = { id: number; name: string }
		type RequestAuth = Request & { user?: User }

		const authent: RequestHandler = (req: RequestAuth, res, next) => {
			req.user = { id: 1, name: 'jeremy' }
			next()
		}

		const CurrentUser = createParamDecorator((req: RequestAuth) => req.user!, [authent], true)

		@Use(authent)
		class Bar {
			@Post('user/:yo')
			post(@CurrentUser user: User, @Res res: Response) {
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
