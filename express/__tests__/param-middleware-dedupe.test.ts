import express, { RequestHandler, Request, Response, json, urlencoded } from 'express'
import { createParamDecorator, Use, Post, Body, Res } from '../src'
import { extractMiddlewares } from '../src/middleware-decorators'
import { extractParamsMiddlewares } from '../src/param-decorators'
import { getGlobalMiddlewares } from '../src/register'

test('body-parsers deduplication', async () => {
	const BodyTrimmed = (subKey: string) =>
		createParamDecorator((req) => req.body[subKey].trim(), [json()], true)

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

	const sharedMwares = extractMiddlewares(DedupeTestRouter)
	const routeMwares = extractMiddlewares(DedupeTestRouter, 'post')
	const paramMwares = extractParamsMiddlewares(DedupeTestRouter, 'post', [[], sharedMwares, routeMwares])

	expect(paramMwares).toHaveLength(0)
})

test('custom middleware deduplication', async () => {
	type User = { id: number; name: string }
	type RequestAuth = Request & { user?: User }

	const authent: RequestHandler = (req: RequestAuth, res, next) => {
		req.user = { id: 1, name: 'jeremy' }
		next()
	}

	const CurrentUser = createParamDecorator((req: RequestAuth) => req.user!, [authent], true)

	@Use(authent)
	class DedupeTestRouter {
		@Post('user/:yo')
		post(@CurrentUser user: User, @Res res: Response) {
			res.send(user)
		}
	}
	const app = express()
	app.use(authent)
	const globalMwares = getGlobalMiddlewares(app)
	const sharedMwares = extractMiddlewares(DedupeTestRouter)
	const routeMwares = extractMiddlewares(DedupeTestRouter, 'post')
	const paramMwares = extractParamsMiddlewares(DedupeTestRouter, 'post', [
		globalMwares,
		sharedMwares,
		routeMwares,
	])

	expect(sharedMwares.some((m) => globalMwares.includes(m))).toBe(true)
	expect(paramMwares).toHaveLength(0)
})
