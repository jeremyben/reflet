import { performance } from 'perf_hooks'
import supertest from 'supertest'
import { log } from '../../testing/tools'
import express, { Response, Request, NextFunction, json } from 'express'
import {
	register,
	Router,
	Get,
	Post,
	Put,
	Patch,
	Use,
	UseBefore,
	UseCatch,
	Res,
	Body,
	Head,
	Params,
	Headers,
	createParamDecorator,
} from '.'

const CurrentUser = createParamDecorator((req) => (req as any).user)
const BodyTrimmed = (subKey: string) => createParamDecorator((req) => req.body[subKey].trim(), [json()])

@Use((req, res, next) => {
	req.headers.shared = 'shared'
	next()
})
@Router('/user')
class TestRouter {
	@Use((req, res, next) => {
		req.headers.via = 'via'
		next()
	})
	@Get()
	async getOne(@Res res: Response, @Headers('via') via: string, @Headers<any>('shared') shared: string) {
		res.send({ via, shared })
	}

	@UseCatch((err, req, res, next) => res.send({ err }))
	@Put('/:id')
	async putOne(@Params params: any) {
		await new Promise((resolve) => setTimeout(resolve, 20))

		const id = Number.parseInt(params.id, 10)
		throw id * 2
	}

	@UseBefore((req, res, next) => {
		;(req as any).user = { id: 1, name: 'jeremy' }
		next()
	})
	@Post()
	postOne(
		@CurrentUser user: object,
		@BodyTrimmed('foot') foot: string,
		@BodyTrimmed('pub') pub: string,
		@Res() res: Response
	) {
		foot = foot + '!'
		pub = pub + '!'
		res.send({ user, foot, pub })
	}

	@Patch('/:id')
	patchOne(@Res() res: Response, @Body body: { foo: number }, @Body<{ foo: number }>('foo') foo: number) {
		res.send({ bar: foo * 2 })
	}

	@Head()
	headOne(req: Request, res: Response, next: NextFunction) {
		res.send('ok')
	}
}

const app = express()
const rq = supertest(app)

const t1 = performance.now()
register(app, [TestRouter])
console.info(`register in ${(performance.now() - t1).toFixed(4)} ms`)

test('shared and route middlewares, use of @Headers', async () => {
	const res = await rq.get('/user')
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ via: 'via', shared: 'shared' })
})

test('async error handler, use of @Param', async () => {
	const res = await rq.put('/user/25').send({ foo: 1 })
	expect(res.body).toEqual({ err: 50 })
})

test('use of @Body with auto body-parser', async () => {
	const res = await rq.patch('/user/25').send({ foo: 5 })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({ bar: 10 })
})

test('custom decorators', async () => {
	const res = await rq.post('/user').send({ foot: ' Champions du monde  ', pub: '  O Ballec  ' })
	expect(res.status).toBe(200)
	expect(res.body).toEqual({
		user: { id: 1, name: 'jeremy' },
		foot: 'Champions du monde!',
		pub: 'O Ballec!',
	})
})
