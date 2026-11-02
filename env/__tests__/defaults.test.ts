import { Var, Environment, EnvValidationError, Sensitive, Default } from '../src'

describe('Default values', () => {
	test('property initializers are default values', () => {
		class Base extends Environment {
			@Var.Str() HOST = 'localhost'
		}
		class E extends Base {
			@Var.Port() PORT = 3000
			@Var.Str() OTHER!: string
			@Var.Bool() F: boolean = false
			@Var.Num({ optional: true }) N?: number = 1
		}

		expect(() => E.load({})).toThrow(/OTHER \(missing\)/)
		expect(E.load({ OTHER: 'o' })).toEqual({ HOST: 'localhost', PORT: 3000, OTHER: 'o', F: false, N: 1 })
		expect(E.load({ HOST: 'db', PORT: '80', OTHER: 'o' })).toMatchObject({ HOST: 'db', PORT: 80 })
		expect(E.load({ OTHER: 'o', F: 'true' }).N).toBe(1)
		expect(E.load({ OTHER: 'o', NODE_ENV: 'production' }).PORT).toBe(3000)
	})

	test('property initializers are validated like defaults', () => {
		class E extends Environment {
			@Var.Port() P = 99999
			@Var.Str({ choices: ['a', 'b'] }) C: 'a' | 'b' | 'z' = 'z'
		}
		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err.invalid.map((e: any) => e.name)).toEqual(['P', 'C'])
			expect(err.invalid[0].message).toContain('invalid default value')
		}
	})

	test('defaults of built-in scalar types are validated', () => {
		class E extends Environment {
			@Var.Port() P: number = 99999
			@Sensitive() @Var.Url() U: string = 'nope'
			@Var.Num() N: number = NaN
			@Var.Email() M: string = 'a@b.co'
			@Var.Str() S: string = ''
		}

		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.name)).toEqual(['P', 'U', 'N'])
			expect(err.errors[0].message).toBe(
				'invalid default value: "P" must be a valid port number (1-65535) (got 99999)'
			)
			expect(err.errors[1].message).toBe('invalid default value: "U" must be a valid URL')
		}
	})

	test('defaults are validated, not coerced, and JSON defaults are copied before freezing', () => {
		const def = { a: 1 }
		class E extends Environment {
			@Var.Host() H = 'localhost'
			@Var.Json() J: { a: number } = def
		}
		const env = E.load({})
		expect(env.H).toBe('localhost')
		expect(env.J).toEqual({ a: 1 })

		// Not trimmed, as environment values.
		class Padded extends Environment {
			@Var.Host() H = ' localhost '
		}
		expect(() => Padded.load({})).toThrow('invalid default value: "H" must be a valid hostname or IP')
		expect(Padded.load({ H: ' localhost ' }).H).toBe('localhost')

		// Typed defaults, not strings to coerce.
		class Untyped extends Environment {
			@Var.Num() N = '5' as unknown as number
			@Var.Bytes({ length: 2 }) B = Buffer.from('abc')
			@Var.Str() S = 1 as unknown as string
			@Var.Bool() BOOL = 'true' as unknown as boolean
			@Var.Bytes() HEX = 'ab' as unknown as Buffer
			@Var.List() L = 'a,b' as unknown as string[]
			// Coercion only: defaults are taken as is.
			@Var.Custom({ coerce: Number }) C = 'not validated' as unknown as number
		}
		expect(() => Untyped.load({})).toThrow(/"N" must be a finite decimal number \(got "5"\)[^]*"B" must be 2 bytes/)
		expect(Object.isFrozen(env.J)).toBe(true)
		expect(Object.isFrozen(def)).toBe(false)
	})

	test('a subclass initializer overrides the inherited one', () => {
		class P extends Environment {
			@Var.Port() PORT = 3000
		}
		class C extends P {
			@Var.Port() PORT = 4000
		}
		expect(P.load({}).PORT).toBe(3000)
		expect(C.load({}).PORT).toBe(4000)
		expect(C.load({ PORT: '80' }).PORT).toBe(80)

		// Plain initializer, e.g. in a test environment.
		class Base extends Environment {
			@Var.Str() API_TOKEN!: string
		}
		class TestEnv extends Base {
			API_TOKEN = 'fake-token'
		}
		expect(() => Base.load({})).toThrow(/API_TOKEN \(missing\)/)
		expect(TestEnv.load({}).API_TOKEN).toBe('fake-token')
		expect(TestEnv.load({ API_TOKEN: 'real' }).API_TOKEN).toBe('real')
	})

	test('bare declarations defined as undefined (useDefineForClassFields)', () => {
		// Simulates ES2022+ class fields semantics, which define declared properties without initializer.
		class E extends Environment {
			@Var.Port() PORT: number = 3000
			@Var.Str() NAME!: string

			constructor() {
				super()
				for (const key of ['NAME']) {
					Object.defineProperty(this, key, {
						value: undefined,
						writable: true,
						enumerable: true,
						configurable: true,
					})
				}
			}
		}

		const env = E.load({ NAME: 'app' })
		expect(env.PORT).toBe(3000)
		expect(() => E.load({})).toThrow(/NAME \(missing\)/)
	})

	test('null initializers are not defaults', () => {
		class E extends Environment {
			@Var.Num({ optional: true }) N?: number | null = null
			@Var.Str() S: string | null = null
		}
		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => [e.name, e.kind])).toEqual([['S', 'missing']])
		}
		expect(E.load({ S: 's' })).toEqual({ N: null, S: 's' })
	})

	test('non-serializable JSON defaults are reported', () => {
		class E extends Environment {
			@Var.Json() J = { n: BigInt(1) }
			@Var.Str() OTHER!: string
		}
		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.errors.map((e: any) => e.name)).toEqual(['J', 'OTHER'])
			expect(err.errors[0].message).toMatch(/^invalid default value: .*BigInt/)
		}
	})
})

describe('Default', () => {
	const nodeEnv = process.env.NODE_ENV
	afterEach(() => {
		process.env.NODE_ENV = nodeEnv
	})

	class E extends Environment {
		@Var.Url() APP_ORIGIN = Default.byNodeEnv({
			development: 'http://localhost:4000',
			test: 'http://localhost:4000',
		})
		@Var.Bool() TLS = Default.byNodeEnv({ production: true, default: false })
		@Var.Str({ choices: ['json', 'pretty'] }) LOG: 'json' | 'pretty' = Default.byNodeEnv({
			production: 'json',
			default: 'pretty',
		})
		@Var.Str() KEY = Default.byNodeEnv({ production: undefined, default: 'fake' })
	}

	test('picks defaults by NODE_ENV of the source being loaded', () => {
		expect({ ...E.load({ NODE_ENV: 'development' }) }).toEqual({
			APP_ORIGIN: 'http://localhost:4000',
			TLS: false,
			LOG: 'pretty',
			KEY: 'fake',
		})

		const production = { NODE_ENV: 'production' }
		expect({ ...E.load({ ...production, APP_ORIGIN: 'https://example.com', KEY: 'k' }) }).toEqual({
			APP_ORIGIN: 'https://example.com',
			TLS: true,
			LOG: 'json',
			KEY: 'k',
		})
		// A production value, even undefined, takes precedence over `default`.
		expect(() => E.load(production)).toThrow(/APP_ORIGIN \(missing\)[^]*KEY \(missing\)/)

		// Unknown or unset NODE_ENV: `default`, or required.
		for (const source of [{ NODE_ENV: 'staging' }, { NODE_ENV: 'toString' }, {}]) {
			expect(() => E.load(source)).toThrow(/APP_ORIGIN \(missing\)/)
			expect(E.load({ ...source, APP_ORIGIN: 'https://example.com' })).toMatchObject({ TLS: false, KEY: 'fake' })
		}

		// `process.env` by default, and outside of `load`.
		process.env.NODE_ENV = 'production'
		expect(Default.byNodeEnv({ production: 1, default: 2 })).toBe(1)
		expect(() => E.load()).toThrow(/APP_ORIGIN \(missing\)/)
	})

	test('picks defaults by another variable', () => {
		const byAppEnv = Default.by<'local' | 'staging' | 'production'>('APP_ENV')
		class A extends Environment {
			@Var.Host() MAIL_DOMAIN = byAppEnv({ production: 'example.com', default: 'staging.example.com' })
			@Var.Str() TOKEN = byAppEnv({ local: 'fake' })
		}
		expect(() => A.load({ APP_ENV: 'staging' })).toThrow(/TOKEN \(missing\)/)
		expect(A.load({ APP_ENV: 'staging', TOKEN: 't' }).MAIL_DOMAIN).toBe('staging.example.com')
		expect(A.load({ APP_ENV: 'local' })).toMatchObject({ MAIL_DOMAIN: 'staging.example.com', TOKEN: 'fake' })
		expect(A.load({ APP_ENV: 'production', TOKEN: 't' }).MAIL_DOMAIN).toBe('example.com')
	})

	test('types', () => {
		const tls: boolean = Default.byNodeEnv({ production: true, default: false })
		// @ts-expect-error unknown environment
		Default.byNodeEnv({ prod: true })
		// @ts-expect-error unknown environment
		Default.by<'local' | 'production'>('local')({ test: 1 })
		// @ts-expect-error inferred type
		const port: string = Default.byNodeEnv({ default: 3000 })
		expect([tls, port]).toBeDefined()
	})
})
