import supertest from 'supertest'
import express, { Response, Request, json, urlencoded } from 'express'
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
	createParamDecorator,
	Query,
	Delete,
} from '../src'
import { extractRouteParamsMiddlewares } from '../src/decorators/route-param.decorators'
import { extractMiddlewares } from '../src/decorators/middleware.decorators'
import { log } from '../../testing/tools'

const CurrentUser = createParamDecorator((req: Request & { user?: any }) => req.user)
const BodyTrimmed = (subKey: string) => createParamDecorator((req) => req.body[subKey].trim(), [json()])

@Use((req: Request & { user?: any }, res, next) => {
	req.user = { id: 1, name: 'jeremy' }
	req.headers.via = 'via'
	req.headers.shared = 'shared'
	next()
})
@Router('/bar')
class BarTestRouter {
	@Get()
	async get(@Headers('via') via: string, @Headers<any>('shared') shared: string, @Res res: Response) {
		res.send({ via, shared })
	}

	@Post()
	post(@Body body: { foo: number }, @Body<{ foo: number }>('foo') foo: number, @Res res: Response) {
		res.send({ bar: foo * body.foo })
	}

	@Put('/:id')
	put(@Params params: any, @Query('q') q: string, @Res() res: Response) {
		const bar = Number.parseInt(params.id, 10) * 2
		res.send({ bar, baz: q })
	}

	@Delete()
	delete(@CurrentUser user: object, @Res() res: Response) {
		res.send({ user })
	}

	@Patch()
	patch(@BodyTrimmed('foot') foot: string, @BodyTrimmed('pub') pub: string, @Res() res: Response) {
		foot = foot + '!'
		pub = pub + '!'
		res.send({ foot, pub })
	}
}

const app = express()
const rq = supertest(app)
register(app, [BarTestRouter])

test('@Headers', async () => {
	const res = await rq.get('/bar')
	expect(res.body).toEqual({ via: 'via', shared: 'shared' })
})

test('@Body with auto body-parser', async () => {
	const res = await rq.post('/bar').send({ foo: 5 })
	expect(res.body).toEqual({ bar: 25 })
})

test('@Params and @Query', async () => {
	const res = await rq.put('/bar/25?q=yes')
	expect(res.body).toEqual({ bar: 50, baz: 'yes' })
})

describe('custom decorators', () => {
	test('simple decorator', async () => {
		const res = await rq.delete('/bar')
		expect(res.body).toEqual({
			user: { id: 1, name: 'jeremy' },
		})
	})

	test('decorator with options and middleware', async () => {
		const res = await rq.patch('/bar').send({ foot: ' Champions du monde  ', pub: '  O Ballec  ' })
		expect(res.body).toEqual({
			foot: 'Champions du monde!',
			pub: 'O Ballec!',
		})
	})
})

describe('param middleware deduplication', () => {
	// tslint:disable: no-shadowed-variable

	const BodyTrimmed = (subKey: string) => createParamDecorator((req) => req.body[subKey].trim(), [json()])

	@Use(json(), urlencoded({ extended: false }))
	class DedupeTestRouter {
		@Use(json())
		@Post()
		post(
			@BodyTrimmed('foo') fooTrimmed: string,
			@Body('foo') foo: string,
			@Body body: any,
			@Res res: Response
		) {
			res.send(fooTrimmed)
		}
	}

	test('body-parsers dedupe', async () => {
		const sharedMwares = extractMiddlewares(DedupeTestRouter)
		const routeMwares = extractMiddlewares(DedupeTestRouter, 'post')
		const paramMwares = extractRouteParamsMiddlewares(DedupeTestRouter, 'post', [
			sharedMwares,
			routeMwares,
		])

		expect(paramMwares).toHaveLength(0)
	})
})
