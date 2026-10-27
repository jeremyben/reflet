import * as supertest from 'supertest'
import * as express from 'express'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import * as http from 'http'
import { AddressInfo } from 'net'
import { register, Get, Post, Put, Patch, Delete, Router } from '@reflet/express'
import { UseOnFinish, UseInterceptor } from '../src'
import { createDummyFile, log } from '../../testing/tools'

const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
afterEach(() => consoleSpy.mockClear())
afterAll(() => consoleSpy.mockRestore())

describe('response properties on finish event', () => {
	@Router('/')
	class Controller {
		@UseOnFinish((req, res) => console.info(res.headersSent, res.finished, res.writableEnded, res.statusCode))
		@Get()
		get(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.sendStatus(201)
		}

		@UseOnFinish((req, res) => console.info((res as any).body))
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

	test('headersSent, finished, writableEnded, status', async () => {
		const res = await rq.get('/')
		expect(res.status).toBe(201)
		expect(consoleSpy).toHaveBeenCalledWith(true, true, true, 201)
	})

	test('body is not exposed', async () => {
		const res = await rq.put('/')
		expect(res.text).toBe('done')
		expect(consoleSpy).toHaveBeenCalledWith(undefined)
	})

	test('catch errors', async () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {})
		const res = await rq.post('/')
		expect(res.status).toBe(200)
		expect(consoleErrorSpy).toHaveBeenCalledWith('nope')
	})
})

describe('retrieve body with express methods', () => {
	@Router('/')
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

		@UseOnFinish((req, res) => console.info(res.body), true)
		@UseInterceptor<{ foo: string }, { foo: number }>((body) => ({ foo: 3 }))
		@Delete()
		delete(req: express.Request, res: express.Response, next: express.NextFunction) {
			res.send({ foo: 'foo' })
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('string body with send method', async () => {
		const res = await rq.get('/')
		expect(res.text).toBe('done')
		expect(consoleSpy).toHaveBeenCalledWith('DONE')
	})

	test('string body with json method', async () => {
		const res = await rq.put('/')
		expect(res.text).toBe('"done"')
		expect(consoleSpy).toHaveBeenCalledWith('DONE')
	})

	test('object body with jsonp method', async () => {
		const res = await rq.post('/')
		expect(res.body).toEqual({ foo: 1 })
		expect(consoleSpy).toHaveBeenCalledWith({ foo: 1 })
	})

	test('html error response body', async () => {
		const res = await rq.patch('/')
		// status should be inferred by express default error handler
		expect(res.status).toBe(400)
		expect(consoleSpy).toHaveBeenCalledWith(400, expect.stringContaining('<title>Error</title>'))
	})

	test('with an interceptor', async () => {
		const res = await rq.delete('/')
		expect(res.body).toEqual({ foo: 3 })
		expect(consoleSpy).toHaveBeenCalledWith({ foo: 3 })
	})
})

describe('retrieve body with native methods', () => {
	@Router('/')
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
		const res = await rq.get('/')
		expect(res.text).toBe('done')
		expect(consoleSpy).toHaveBeenCalledWith('done')
	})

	test('string body with end method and custom encoding', async () => {
		const res = await rq.patch('/')
		expect(res.text).toContain('PNG')
		expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PNG'))
	})

	test('string body with write method', async () => {
		const res = await rq.post('/')
		expect(res.text).toBe('<html><body><h1>coucou</h1></body></html>')
		expect(consoleSpy).toHaveBeenCalledWith('<html><body><h1>coucou</h1></body></html>')
	})

	test('binary body with write method', async () => {
		const res = await rq.put('/')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(consoleSpy).toHaveBeenCalledWith(Buffer.from('done', 'binary'))
	})
})

describe('retrieve streamed body', () => {
	createDummyFile(`${__dirname}/temp`, 4e5)

	@Router('/')
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
		const res = await rq.get('/')
		expect(res.status).toBe(200)
		expect(consoleSpy).toHaveBeenCalledWith(res.text.length)
	})

	test('small binary stream', async () => {
		const res = await rq.patch('/')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(consoleSpy).toHaveBeenCalledWith(expect.any(Buffer))
		expect(consoleSpy).toHaveBeenCalledWith(res.body.length)
	})

	test('large string stream', async () => {
		const res = await rq.put('/')
		expect(res.text.length).toBe(4e5)
		expect(consoleSpy).toHaveBeenCalledWith(65536)
	})

	test('large binary stream', async () => {
		const res = await rq.post('/')
		expect(res.body).toBeInstanceOf(Buffer)
		expect(res.body.length).toBe(4e5)
		expect(consoleSpy).toHaveBeenCalledWith(expect.any(Buffer))
		expect(consoleSpy).toHaveBeenCalledWith(65536)
	})
})

describe('retrieve body with mixed chunk types', () => {
	@Router('/mixed')
	class Mixed {
		@UseOnFinish((req, res) => console.info('mixed', String(res.body)), true)
		@Get('/end')
		end(req: express.Request, res: express.Response) {
			res.write('head;')
			res.end(Buffer.from('tail'))
		}

		@UseOnFinish((req, res) => console.info('mixed', String(res.body)), true)
		@Get('/stream')
		stream(req: express.Request, res: express.Response) {
			res.write('prefix;')
			Readable.from([Buffer.from('chunk1;'), Buffer.from('chunk2')]).pipe(res)
		}

		@UseOnFinish((req, res) => console.info('mixed', String(res.body)), true)
		@Get('/uint8array')
		uint8array(req: express.Request, res: express.Response) {
			res.write('head;')
			res.end(new TextEncoder().encode('tail'))
		}
	}

	const rq = supertest(register(express(), [Mixed]))

	test('string then buffer', async () => {
		const res = await rq.get('/mixed/end')
		expect(res.text).toBe('head;tail')
		expect(consoleSpy).toHaveBeenCalledWith('mixed', 'head;tail')
	})

	test('string then piped stream', async () => {
		const res = await rq.get('/mixed/stream')
		expect(res.text).toBe('prefix;chunk1;chunk2')
		expect(consoleSpy).toHaveBeenCalledWith('mixed', 'prefix;chunk1;chunk2')
	})

	test('string then uint8array', async () => {
		const res = await rq.get('/mixed/uint8array')
		expect(res.text).toBe('head;tail')
		expect(consoleSpy).toHaveBeenCalledWith('mixed', 'head;tail')
	})
})

describe('connection closed before the response is complete', () => {
	const calls: boolean[] = []

	@Router('/close')
	class Close {
		@UseOnFinish((req, res) => {
			calls.push(res.writableFinished)
		})
		@Get('/aborted')
		aborted(req: express.Request, res: express.Response) {
			res.write('partial')
			setTimeout(() => res.end(), 100)
		}

		@UseOnFinish((req, res) => {
			calls.push(res.writableFinished)
		})
		@Get('/complete')
		complete(req: express.Request, res: express.Response) {
			res.send('complete')
		}
	}

	const app = register(express(), [Close])
	let server: http.Server
	let port: number

	beforeAll(() => {
		server = app.listen(0)
		port = (server.address() as AddressInfo).port
	})

	afterAll(() => new Promise((resolve) => server.close(resolve)))

	beforeEach(() => {
		calls.length = 0
	})

	test('effect is called once when the client aborts', async () => {
		await new Promise<void>((resolve) => {
			const req = http.get({ port, path: '/close/aborted', agent: false }, (res) => {
				res.once('data', () => req.destroy())
				res.on('close', () => resolve())
			})
			req.on('error', () => resolve())
		})

		await new Promise((resolve) => setTimeout(resolve, 200))
		expect(calls).toEqual([false])
	})

	test('effect is called once when the response is complete', async () => {
		const res = await supertest(app).get('/close/complete')
		await new Promise((resolve) => setTimeout(resolve, 50))
		expect(res.text).toBe('complete')
		expect(calls).toEqual([true])
	})
})
