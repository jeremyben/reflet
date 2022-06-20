import * as supertest from 'supertest'
import * as express from 'express'
import { createReadStream, readFileSync } from 'fs'
import { register, Router, Get, Put, Post, Patch, Delete, Res, Params, Send, Route } from '../src'
import { log } from '../../testing/tools'

describe('handle return value', () => {
	@Router('/')
	class FooRouter {
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
		del() {
			const err = Error('wtf') as any
			err.status = 400
			throw err
		}

		@Send()
		@Patch()
		patch(@Res res: express.Response) {
			res.send({ foo: 4 })
			return { foo: 13 }
		}

		@Send()
		@Put()
		async put(@Res res: express.Response) {
			return res
		}

		@Send<Promise<string>>((data, { res }) => {
			res.status(201).json({ hello: data })
		})
		@Route.Options()
		async options(@Res res: express.Response) {
			return 'world'
		}
	}

	const rq = supertest(register(express(), [FooRouter]))

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
		expect(res.text).toMatch('wtf')
	})

	test('already sent', async () => {
		const res = await rq.patch('')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ foo: 4 })
	})

	test('response object', async () => {
		const res = await rq.put('').accept('json')
		expect(res.status).toBe(500)
		expect(res.text).toMatch('RefletExpressError')
	})

	test('custom handler', async () => {
		const res = await rq.options('')
		expect(res.status).toBe(201)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual({ hello: 'world' })
	})
})

describe('streams', () => {
	@Router('/')
	class FooRouter {
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

		@Send()
		@Post()
		async post(@Res res: express.Response) {
			const readable = createReadStream(__filename)
			return readable.pipe(res)
		}
	}

	const rq = supertest(register(express(), [FooRouter]))
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
		expect(res.status).toBe(200)
		expect(res.header['transfer-encoding']).toBe('chunked')
		expect(res.text).toContain(thisFile)
	})
})

describe('buffers', () => {
	@Router('/')
	class FooRouter {
		@Send()
		@Get()
		get() {
			return readFileSync(__filename)
		}

		@Send()
		@Post()
		post() {
			return Buffer.from('')
		}

		@Send({ json: true })
		@Put()
		async put() {
			return Buffer.from('A')
		}
	}

	const rq = supertest(register(express(), [FooRouter]))

	test('file buffer', async () => {
		const res = await rq.get('')
		expect(res.status).toBe(200)
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
	const JsonRouter = (path: string | RegExp): Router.Decorator & Send.Decorator => {
		return (target) => {
			Router(path)(target as Function)
			Send({ json: true })(target)
		}
	}

	@JsonRouter('/')
	class BarRouter {
		@Get()
		get() {
			return 'bar'
		}

		@Send({ json: false })
		@Post()
		post() {
			return 'bar'
		}

		@Send.Dont
		@Put()
		async put() {
			return 'bar'
		}
	}

	const rq = supertest(register(express(), [BarRouter]))

	test('class decorator combo', async () => {
		const res = await rq.get('/')
		expect(res.status).toBe(200)
		expect(res.type).toBe('application/json')
		expect(res.body).toEqual('bar')
	})

	test('override class options with method options', async () => {
		const res = await rq.post('/')
		expect(res.status).toBe(200)
		expect(res.type).toBe('text/html')
		expect(res.text).toEqual('bar')
	})

	test('dont send', async () => {
		expect(rq.put('/').timeout(150)).rejects.toThrow(/Timeout/)
	})
})
