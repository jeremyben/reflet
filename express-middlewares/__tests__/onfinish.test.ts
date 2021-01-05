import * as supertest from 'supertest'
import * as express from 'express'
import { createReadStream } from 'fs'
import { register, Get, Post, Put, Patch, Delete } from '@reflet/express'
import { UseOnFinish, UseInterceptor } from '../src'
import { createDummyFile, log } from '../../testing/tools'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

describe('response properties on finish event', () => {
	class Controller {
		@UseOnFinish((req, res) => console.info(res.headersSent, res.finished, res.statusCode))
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.sendStatus(201)
		}

		@UseOnFinish((req, res) => console.info(res.wasIntercepted, (res as any).body))
		@UseInterceptor((body) => body)
		@UseInterceptor((body) => body)
		@UseInterceptor((body) => body)
		@Put()
		put(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send('done')
		}

		@UseOnFinish((req, res) => Promise.reject('nope'))
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send('done')
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('headersSent, finished, status', async () => {
		const res = await rq.get('')
		expect(res.status).toBe(201)
		expect(consoleSpy).toBeCalledWith(true, true, 201)
	})

	test('wasIntercepted is exposed, body is not', async () => {
		const res = await rq.put('')
		expect(res.text).toBe('done')
		expect(consoleSpy).toBeCalledWith(3, undefined)
	})

	test('catch errors', async () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {})
		const res = await rq.post('')
		expect(res.status).toBe(200)
		expect(consoleErrorSpy).toBeCalledWith('nope')
	})
})

describe('retrieve body with express methods', () => {
	class Controller {
		@UseOnFinish<string>((req, res) => console.info(res.body.toUpperCase()), true)
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send('done')
		}

		@UseOnFinish<string>((req, res) => console.info(res.body.toUpperCase()), true)
		@Put()
		put(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.json('done')
		}

		@UseOnFinish<{ foo: number }>((req, res) => console.info(res.body), true)
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.jsonp({ foo: 1 })
		}

		@UseOnFinish((req, res) => console.info(res.statusCode, res.body), true)
		@Patch()
		patch(req: express.Request, res: express.Response, next: express.NextFunction) {
			throw { status: 400 }
		}

		@UseOnFinish((req, res) => console.info(res.wasIntercepted, res.body), true)
		@UseInterceptor<{ foo: string }, { foo: number }>((body) => ({ foo: 3 }))
		@Delete()
		delete(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send({ foo: 'foo' })
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('string body with send method', async () => {
		const res = await rq.get('')
		expect(res.text).toBe('done')
		expect(consoleSpy).toBeCalledWith('DONE')
	})

	test('string body with json method', async () => {
		const res = await rq.put('')
		expect(res.text).toBe('"done"')
		expect(consoleSpy).toBeCalledWith('DONE')
	})

	test('object body with jsonp method', async () => {
		const res = await rq.post('')
		expect(res.body).toEqual({ foo: 1 })
		expect(consoleSpy).toBeCalledWith({ foo: 1 })
	})

	test('json error response body', async () => {
		const res = await rq.patch('').accept('application/json')
		// status should be inferred by our global error handler
		expect(res.status).toBe(400)
		expect(consoleSpy).toBeCalledWith(400, { status: 400 })
	})

	test('html error response body', async () => {
		const res = await rq.patch('')
		// status should be inferred by express default error handler
		expect(res.status).toBe(400)
		expect(consoleSpy).toBeCalledWith(400, expect.stringContaining('<title>Error</title>'))
	})

	test('with an interceptor', async () => {
		const res = await rq.delete('')
		expect(res.body).toEqual({ foo: 3 })
		expect(consoleSpy).toBeCalledWith(1, { foo: 3 })
	})
})

describe('retrieve body with native methods', () => {
	class Controller {
		@UseOnFinish<string>((req, res) => console.info(res.body), true)
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.end('done')
		}

		@UseOnFinish<string>((req, res) => console.info(res.body), true)
		@Patch()
		patch(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.end('iVBORw', 'base64')
		}

		@UseOnFinish<string>((req, res) => console.info(res.body), true)
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.write('<html>')
			res.write('<body>')
			res.write('<h1>coucou</h1>')
			res.write('</body>')
			res.end('</html>')
		}

		@UseOnFinish<string>((req, res) => console.info(res.body), true)
		@Put()
		put(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.setHeader('content-type', 'application/octet-stream')
			res.write(Buffer.from('done', 'binary'))
			res.end()
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('string body with end method', async () => {
		const res = await rq.get('')
		expect(res.text).toBe('done')
		expect(consoleSpy).toBeCalledWith('done')
	})

	test('string body with end method and custom encoding', async () => {
		const res = await rq.patch('')
		expect(res.text).toContain('PNG')
		expect(consoleSpy).toBeCalledWith(expect.stringContaining('PNG'))
	})

	test('string body with write method', async () => {
		const res = await rq.post('')
		expect(res.text).toBe('<html><body><h1>coucou</h1></body></html>')
		expect(consoleSpy).toBeCalledWith('<html><body><h1>coucou</h1></body></html>')
	})

	test('binary body with write method', async () => {
		const res = await rq.put('')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(consoleSpy).toBeCalledWith(Buffer.from('done', 'binary'))
	})
})

describe('retrieve streamed body', () => {
	createDummyFile(`${__dirname}/temp`, 4e5)

	class Controller {
		@UseOnFinish<string>((req, res) => console.info(res.body.length), true)
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			createReadStream(__filename, 'utf8').pipe(res)
		}

		@UseOnFinish<Buffer>((req, res) => {
			console.info(res.body)
			console.info(res.body.length)
		}, true)
		@Patch()
		patch(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.download(__filename)
		}

		@UseOnFinish<string>((req, res) => console.info(res.body.length), true)
		@Put()
		put(req: express.Request, res: express.Response, next: express.NextFunction) {
			createReadStream(`${__dirname}/temp`, 'utf8').pipe(res)
		}

		@UseOnFinish<Buffer>((req, res) => {
			console.info(res.body)
			console.info(res.body.length)
		}, true)
		@Post()
		post(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.sendFile(`${__dirname}/temp`)
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('small string stream', async () => {
		const res = await rq.get('')
		expect(res.status).toBe(200)
		expect(consoleSpy).toBeCalledWith(res.text.length)
	})

	test('small binary stream', async () => {
		const res = await rq.patch('')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(consoleSpy).toBeCalledWith(expect.any(Buffer))
		expect(consoleSpy).toBeCalledWith(res.body.length)
	})

	test('large string stream', async () => {
		const res = await rq.put('')
		expect(res.text.length).toBe(4e5)
		expect(consoleSpy).toBeCalledWith(65536)
	})

	test('large binary stream', async () => {
		const res = await rq.post('')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(res.body.length).toBe(4e5)
		expect(consoleSpy).toBeCalledWith(expect.any(Buffer))
		expect(consoleSpy).toBeCalledWith(65536)
	})
})
