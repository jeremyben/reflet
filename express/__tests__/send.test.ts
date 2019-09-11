import supertest from 'supertest'
import express, { Response, NextFunction, Request } from 'express'
import { createReadStream, readFileSync } from 'fs'
import { register, Router, Get, Put, Post, Patch, Req, Res, Send, DontSend, Delete, Params } from '../src'
import { log } from '../../testing/tools'

describe('handle return value', () => {
	class Controller {
		@Send()
		@Get('/:type')
		get(@Params('type') type: 'string' | 'object') {
			if (type === 'string') return 'foo'
			else if (type === 'object') return { foo: 1 }
			else return
		}

		@Send({ json: true })
		@Post('/:type')
		async post(@Params('type') type: 'string' | 'object') {
			await new Promise((resolve) => setTimeout(resolve, 20))
			if (type === 'string') return 'foo'
			else if (type === 'object') return { foo: 2 }
			else return
		}

		@Send()
		@Delete()
		del(@Req req: Request, @Res res: Response) {
			const err = Error('wtf') as any
			err.status = 400
			throw err
		}

		@Send()
		@Patch()
		patch(@Req req: Request, @Res res: Response) {
			res.send({ foo: 4 })
			return { foo: 13 }
		}

		@Send()
		@Put()
		async put(@Res res: Response) {
			return res
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('object value', async () => {
		const res = await rq.get('/object')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual({ foo: 1 })
	})

	test('string value', async () => {
		const res = await rq.get('/string')
		expect(res.status).toBe(200)
		expect(res.type).toBe('text/html')
		expect(res.text).toBe('foo')
	})

	test('async', async () => {
		const res = await rq.post('/object')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual({ foo: 2 })
	})

	test('force json', async () => {
		const res = await rq.post('/string')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toBe('foo')
	})

	test('error thrown', async () => {
		const res = await rq.delete('').accept('json')
		expect(res.status).toBe(400)
		expect(res.body).toEqual({ status: 400, message: 'wtf' })
	})

	test('already sent', async () => {
		const res = await rq.patch('')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ foo: 4 })
	})

	test('response object', async () => {
		const res = await rq.put('').accept('json')
		expect(res.status).toBe(500)
		expect(res.body.message).toMatch('Response')
	})
})

describe('specific status', () => {
	class Controller {
		@Send({ status: 201, undefinedStatus: 404, nullStatus: 204 })
		@Put('/:type')
		async put(@Params('type') type: 'null' | 'undefined', @Req req: Request, @Res res: Response) {
			if (type === 'null') return null
			if (type === 'undefined') return

			return { foo: 3 }
		}
	}

	const app = express()
	const rq = supertest(app)
	register(app, [Controller])

	test('success', async () => {
		const res = await rq.put('/yolo')
		expect(res.status).toBe(201)
		expect(res.body).toEqual({ foo: 3 })
	})

	test('undefined', async () => {
		const res = await rq.put('/undefined')
		expect(res.status).toBe(404)
		expect(res.text).toEqual('')
	})

	test('null', async () => {
		const res = await rq.put('/null')
		expect(res.status).toBe(204)
		expect(res.text).toEqual('')
	})
})

describe('streams', () => {
	class Controller {
		@Send()
		@Get()
		get() {
			return createReadStream(__filename)
		}

		@Send()
		@Put()
		async put() {
			return createReadStream(__filename)
		}

		@Send({ status: 201 })
		@Post()
		async post(@Res res: Response) {
			const readable = createReadStream(__filename)
			return readable.pipe(res)
		}
	}

	const rq = supertest(register(express(), [Controller]))
	const thisFile = readFileSync(__filename, 'utf8')

	test('readable stream', async () => {
		const res = await rq.get('')
		expect(res.status).toBe(200)
		expect(res.header['transfer-encoding']).toBe('chunked')
		expect(res.text).toContain(thisFile)
	})

	test('async readable stream', async () => {
		const res = await rq.put('')
		expect(res.status).toBe(200)
		expect(res.header['transfer-encoding']).toBe('chunked')
		expect(res.text).toContain(thisFile)
	})

	test('streaming response object', async () => {
		const res = await rq.post('')
		expect(res.status).toBe(201)
		expect(res.header['transfer-encoding']).toBe('chunked')
		expect(res.text).toContain(thisFile)
	})
})

describe('buffers', () => {
	class Controller {
		@Send({ status: 201 })
		@Get()
		get(@Res res: Response) {
			return readFileSync(__filename)
		}

		@Send()
		@Post()
		post(@Res res: Response) {
			return Buffer.from('')
		}

		@Send({ json: true })
		@Put()
		async put() {
			return Buffer.from('A')
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('file buffer', async () => {
		const res = await rq.get('')
		expect(res.status).toBe(201)
		expect(res.type).toBe('application/octet-stream')
		expect(res.body).toBeInstanceOf(Buffer)
	})

	test('empty buffer', async () => {
		const res = await rq.post('')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/octet-stream')
		expect(res.header['content-length']).toBe('0')
		expect(res.body).toBeInstanceOf(Buffer)
	})

	test('buffer forced to json', async () => {
		const res = await rq.put('')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual({ type: 'Buffer', data: [65] })
	})
})

describe('class decorator', () => {
	const JsonRouter = (path: string | RegExp): ClassDecorator => {
		return (target) => {
			Router(path)(target)
			Send({ json: true, undefinedStatus: 404 })(target)
		}
	}

	@Send()
	@JsonRouter('/bar')
	class Controller {
		@Get()
		get(req: Request, res: Response, next: NextFunction) {
			return { bar: 1 }
		}

		@DontSend()
		@Put()
		async put(@Req req: Request, @Res res: Response) {
			return 'bar'
		}
	}

	const rq = supertest(register(express(), [Controller]))

	test('class decorator combo', async () => {
		const res = await rq.get('/bar')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual({ bar: 1 })
	})

	test('send exception', async () => {
		expect(rq.put('/bar').timeout(200)).rejects.toThrow(/Timeout/)
	})
})
