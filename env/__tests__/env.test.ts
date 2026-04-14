import { Env, initEnv, EnvInit, EnvValidationError } from '../src'

describe('initEnv', () => {
	test('parses basic types', () => {
		class E {
			@Env.Str() NODE_ENV!: string
			@Env.Num() COUNT!: number
			@Env.Bool() DEBUG!: boolean
			@Env.Port() PORT!: number
			@Env.Url() API_URL!: string
			@Env.Email() ADMIN!: string
			@Env.Host() HOST!: string
			@Env.Json<{ a: number }>() DATA!: { a: number }
		}

		const env = initEnv(E, {
			NODE_ENV: 'test',
			COUNT: '42',
			DEBUG: 'true',
			PORT: '8080',
			API_URL: 'https://example.com',
			ADMIN: 'a@b.co',
			HOST: 'localhost',
			DATA: '{"a":1}',
		})

		expect(env).toEqual({
			NODE_ENV: 'test',
			COUNT: 42,
			DEBUG: true,
			PORT: 8080,
			API_URL: 'https://example.com',
			ADMIN: 'a@b.co',
			HOST: 'localhost',
			DATA: { a: 1 },
		})
	})

	test('uses default and devDefault', () => {
		class E {
			@Env.Num({ default: 10 }) A!: number
			@Env.Str({ devDefault: 'dev' }) B!: string
		}

		const env = initEnv(E, { NODE_ENV: 'development' })
		expect(env.A).toBe(10)
		expect(env.B).toBe('dev')
	})

	test('devDefault ignored in production', () => {
		class E {
			@Env.Str({ devDefault: 'dev' }) B!: string
		}
		expect(() => initEnv(E, { NODE_ENV: 'production' })).toThrow(EnvValidationError)
	})

	test('aggregates errors', () => {
		class E {
			@Env.Num() A!: number
			@Env.Port() P!: number
			@Env.Str() M!: string
		}

		try {
			initEnv(E, { A: 'nope', P: '99999' })
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.errors).toHaveLength(3)
			expect(err.errors.map((e: any) => e.name).sort()).toEqual(['A', 'M', 'P'])
		}
	})

	test('choices restriction', () => {
		class E {
			@Env.Str({ choices: ['a', 'b'] as const }) X!: 'a' | 'b'
		}
		expect(initEnv(E, { X: 'a' }).X).toBe('a')
		expect(() => initEnv(E, { X: 'c' })).toThrow(/one of/)
	})

	test('custom parser', () => {
		class E {
			@Env.Custom((raw) => raw.split(',')) LIST!: string[]
		}
		expect(initEnv(E, { LIST: 'a,b,c' }).LIST).toEqual(['a', 'b', 'c'])
	})

	test('EnvInit base class', () => {
		class E extends EnvInit<typeof E> {
			@Env.Num({ default: 1 }) N!: number
		}
		const env = E.init({})
		expect(env.N).toBe(1)
	})

	test('computed properties depend on earlier props', () => {
		class E {
			@Env.Host() HOST!: string
			@Env.Port({ default: 3000 }) PORT!: number

			@Env.Computed<E>((e) => `http://${e.HOST}:${e.PORT}`)
			BASE_URL!: string

			@Env.Computed<E>((e) => e.BASE_URL + '/v1')
			API_URL!: string
		}

		const env = initEnv(E, { HOST: 'localhost' })
		expect(env.BASE_URL).toBe('http://localhost:3000')
		expect(env.API_URL).toBe('http://localhost:3000/v1')
	})

	test('result is frozen', () => {
		class E {
			@Env.Str({ default: 'x' }) A!: string
		}
		const env = initEnv(E, {})
		expect(() => ((env as any).A = 'y')).toThrow()
	})

	test('requiredWhen makes a var conditionally required', () => {
		class E {
			@Env.Bool({ default: false }) USE_S3!: boolean
			@Env.Str({ requiredWhen: (env: E) => env.USE_S3 === true }) S3_BUCKET!: string
		}

		const env = initEnv(E, { USE_S3: 'false' })
		expect(env.USE_S3).toBe(false)
		expect((env as any).S3_BUCKET).toBeUndefined()

		expect(() => initEnv(E, { USE_S3: 'true' })).toThrow(EnvValidationError)
		try {
			initEnv(E, { USE_S3: 'true' })
		} catch (err: any) {
			expect(err.missing).toHaveLength(1)
			expect(err.missing[0].name).toBe('S3_BUCKET')
		}
	})

	test('NODE_ENV shortcuts', () => {
		class E {
			@Env.Str({ default: 'x' }) A!: string
		}
		expect(initEnv(E, { NODE_ENV: 'production' }).isProduction).toBe(true)
		expect(initEnv(E, { NODE_ENV: 'production' }).isDev).toBe(false)
		expect(initEnv(E, { NODE_ENV: 'test' }).isTest).toBe(true)
		expect(initEnv(E, { NODE_ENV: 'development' }).isDev).toBe(true)
	})

	test('testDefault only kicks in when NODE_ENV=test', () => {
		class E {
			@Env.Str({ testDefault: 'mock-token' }) API_TOKEN!: string
		}
		expect(initEnv(E, { NODE_ENV: 'test' }).API_TOKEN).toBe('mock-token')
		expect(() => initEnv(E, { NODE_ENV: 'production' })).toThrow(EnvValidationError)
	})

	test('EnvValidationError exposes kind and metadata', () => {
		class E {
			@Env.Num({ desc: 'Item count', example: '42', docs: 'https://docs/COUNT' }) COUNT!: number
			@Env.Str({ desc: 'API key' }) API_KEY!: string
		}

		try {
			initEnv(E, { COUNT: 'nope' })
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.invalid).toHaveLength(1)
			expect(err.missing).toHaveLength(1)
			expect(err.invalid[0]).toMatchObject({
				name: 'COUNT',
				kind: 'invalid',
				desc: 'Item count',
				example: '42',
				docs: 'https://docs/COUNT',
			})
			expect(err.message).toContain('Item count')
			expect(err.message).toContain('42')
			expect(err.message).toContain('https://docs/COUNT')
			expect(err.message).toContain('API_KEY (missing)')
		}
	})
})
