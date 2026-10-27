import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { inspect } from 'util'
import { Var, Environment, EnvValidationError, Sensitive, Secrets, UnsetSensitive } from '../src'

describe('Environment.load', () => {
	test('parses basic types', () => {
		class E extends Environment {
			@Var.Str() NODE_ENV!: string
			@Var.Num() COUNT!: number
			@Var.Bool() DEBUG!: boolean
			@Var.Port() PORT!: number
			@Var.Url() API_URL!: string
			@Var.Email() ADMIN!: string
			@Var.Host() HOST!: string
			@Var.Json<{ a: number }>() DATA!: { a: number }
		}

		const env = E.load({
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

	test('aggregates errors', () => {
		class E extends Environment {
			@Var.Num() A!: number
			@Var.Port() P!: number
			@Var.Str() M!: string
		}

		try {
			E.load({ A: 'nope', P: '99999' })
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.errors).toHaveLength(3)
			expect(err.errors.map((e: any) => e.name).sort()).toEqual(['A', 'M', 'P'])
		}
	})

	test('choices restriction', () => {
		class E extends Environment {
			@Var.Str({ choices: ['a', 'b'] as const }) X!: 'a' | 'b'
		}
		expect(E.load({ X: 'a' }).X).toBe('a')
		expect(() => E.load({ X: 'c' })).toThrow(/one of/)
	})

	test('custom parser', () => {
		class E extends Environment {
			@Var.Custom((raw) => raw.split(',')) LIST!: string[]
		}
		expect(E.load({ LIST: 'a,b,c' }).LIST).toEqual(['a', 'b', 'c'])
	})

	test('Environment base class', () => {
		class E extends Environment {
			@Var.Num() N: number = 1
		}
		const env = E.load({})
		expect(env.N).toBe(1)
		expect(env).toBeInstanceOf(E)
		expect(Object.isFrozen(env)).toBe(true)
	})

	test('an environment cannot be created without validation', () => {
		class E extends Environment {
			@Var.Port() PORT = 3000
		}
		// @ts-expect-error protected constructor
		const unvalidated = () => new E()
		expect(unvalidated).toBeDefined()

		// Type checked, but meaningless on the base class itself.
		expect(() => Environment.load({})).toThrow('`load` must be called on a class extending `Environment`.')
	})

	test('getters derive values from env properties', () => {
		class E extends Environment {
			@Var.Host() HOST!: string
			@Var.Port() PORT = 3000

			get BASE_URL() {
				return `http://${this.HOST}:${this.PORT}`
			}
		}

		const env = E.load({ HOST: 'localhost' })
		expect(env.BASE_URL).toBe('http://localhost:3000')
		expect(JSON.parse(JSON.stringify(env))).toEqual({ HOST: 'localhost', PORT: 3000 })
	})

	test('result is frozen', () => {
		class E extends Environment {
			@Var.Str() A: string = 'x'
		}
		const env = E.load({})
		expect(() => ((env as any).A = 'y')).toThrow()
	})

	test('requiredWhen makes a var conditionally required', () => {
		class E extends Environment {
			@Var.Bool() USE_S3: boolean = false
			@Var.Str({ requiredWhen: (env: E) => env.USE_S3 === true }) S3_BUCKET?: string
		}

		const env = E.load({ USE_S3: 'false' })
		expect(env.USE_S3).toBe(false)
		expect((env as any).S3_BUCKET).toBeUndefined()

		expect(() => E.load({ USE_S3: 'true' })).toThrow(EnvValidationError)
		try {
			E.load({ USE_S3: 'true' })
		} catch (err: any) {
			expect(err.missing).toHaveLength(1)
			expect(err.missing[0].name).toBe('S3_BUCKET')
		}
	})

	test('NODE_ENV flags can be defined as getters, and used in predicates', () => {
		class E extends Environment {
			@Var.Str({ choices: ['development', 'production', 'test'] }) NODE_ENV!:
				| 'development'
				| 'production'
				| 'test'
			@Var.Url({ requiredWhen: (env: E) => env.isProduction }) SENTRY_DSN?: string

			get isProduction() {
				return this.NODE_ENV === 'production'
			}
		}

		expect(E.load({ NODE_ENV: 'development' }).isProduction).toBe(false)
		expect(() => E.load({ NODE_ENV: 'production' })).toThrow(/SENTRY_DSN \(missing\)/)
		expect(E.load({ NODE_ENV: 'production', SENTRY_DSN: 'https://sentry.io' }).isProduction).toBe(true)
		expect(Object.keys(E.load({ NODE_ENV: 'test' }))).toEqual(['NODE_ENV'])
	})

	test('EnvValidationError exposes kind and metadata', () => {
		class E extends Environment {
			@Var.Num({ desc: 'Item count', example: '42', docs: 'https://docs/COUNT' }) COUNT!: number
			@Var.Str({ desc: 'API key' }) API_KEY!: string
		}

		try {
			E.load({ COUNT: 'nope' })
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

	test('inherits decorated properties from parent classes', () => {
		class Base extends Environment {
			@Var.Str() A!: string
			@Var.Num() N: number = 1
		}
		class Child extends Base {
			@Var.Str() B!: string
			@Var.Num({ choices: [2, 3] }) N: number = 2
		}

		expect(() => Child.load({ B: 'b' })).toThrow(/A \(missing\)/)

		const env = Child.load({ A: 'a', B: 'b' })
		expect(env).toEqual({ A: 'a', B: 'b', N: 2 })
		expect(Object.keys(env).sort()).toEqual(['A', 'B', 'N'])
		expect(() => Child.load({ A: 'a', B: 'b', N: '1' })).toThrow(/N \(invalid\): must be one of \[2, 3\]/)

		const base = Base.load({ A: 'a', N: '5' })
		expect(base).toEqual({ A: 'a', N: 5 })
	})

	test('requiredWhen keeps defaults when not required', () => {
		class E extends Environment {
			@Var.Bool() F: boolean = false
			@Var.Num({ requiredWhen: (e: E) => e.F }) N?: number = 5
		}
		expect(E.load({}).N).toBe(5)
		expect(E.load({ F: 'true' }).N).toBe(5)
	})

	test('requiredWhen predicate errors are aggregated', () => {
		class E extends Environment {
			@Var.Json() C: any = {}
			@Var.Num({ requiredWhen: (e: E) => e.C.x.y }) N?: number
		}
		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.invalid[0]).toMatchObject({ name: 'N', kind: 'invalid' })
			expect(err.invalid[0].message).toContain('requiredWhen')
		}
	})

	test('sensitive values are not included in error messages', () => {
		class E extends Environment {
			@Sensitive() @Var.Url() DB!: string
			@Sensitive() @Var.Json() CREDS!: unknown
			@Sensitive() @Var.Str({ choices: ['a'] }) KEY!: 'a'
			@Var.Url() PUBLIC!: string
		}
		try {
			E.load({ DB: 'postgres//user:s3cr3t@host', CREDS: '{s3cr3t', KEY: 's3cr3t', PUBLIC: 'nope' })
			fail('should throw')
		} catch (err: any) {
			expect(err.invalid).toHaveLength(4)
			expect(err.message).not.toContain('s3cr3t')
			expect(err.message).toContain('(got "nope")')
		}
	})

	test('numbers are parsed strictly', () => {
		class E extends Environment {
			@Var.Num() N!: number
		}
		expect(E.load({ N: ' -1.5e3 ' }).N).toBe(-1500)
		expect(E.load({ N: '.5' }).N).toBe(0.5)
		for (const N of ['  ', '0x50', 'Infinity', '1_000', '12px']) {
			expect(() => E.load({ N })).toThrow(EnvValidationError)
		}

		class P extends Environment {
			@Var.Port() P!: number
		}
		expect(() => P.load({ P: '0x50' })).toThrow(EnvValidationError)
	})

	test('requiredWhen predicate can use getters', () => {
		class E extends Environment {
			@Var.Str() REGION: string = 'eu'
			@Var.Str({ requiredWhen: (env: E) => env.isEurope }) GDPR_CONTACT?: string

			get isEurope() {
				return this.REGION === 'eu'
			}
		}

		expect(() => E.load({})).toThrow(/GDPR_CONTACT \(missing\)/)
		expect(E.load({ REGION: 'us' }).GDPR_CONTACT).toBeUndefined()
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

	test('non-Error throws are reported', () => {
		class E extends Environment {
			@Var.Custom((): string => {
				throw 'nope'
			})
			A!: string

			@Var.Num({
				requiredWhen: () => {
					throw 42
				},
			})
			B?: number
		}

		try {
			E.load({ A: 'a' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'nope (got "a")',
				'requiredWhen predicate failed: 42',
			])
		}
	})

	test('name option', () => {
		class E extends Environment {
			@Var.Port({ name: 'APP_PORT' }) port!: number
		}
		expect(E.load({ APP_PORT: '80' })).toEqual({ port: 80 })
		expect(() => E.load({ port: '80' })).toThrow(/APP_PORT \(missing\)/)
	})

	test('invalid values of built-in types', () => {
		class E extends Environment {
			@Var.Bool() B!: boolean
			@Var.Url() U!: string
			@Var.Email() M!: string
			@Var.Host() H!: string
			@Var.Json() J!: unknown
		}

		try {
			E.load({ B: 'maybe', U: 'example.com', M: 'a@b', H: 'a b', J: '{a:1}' })
			fail('should throw')
		} catch (err: any) {
			expect(err.invalid.map((e: any) => e.message)).toEqual([
				'"B" must be a boolean (true|false|1|0|yes|no|on|off) (got "maybe")',
				'"U" must be a valid URL (got "example.com")',
				'"M" must be a valid email (got "a@b")',
				'"H" must be a valid hostname or IP (got "a b")',
				'"J" must be valid JSON (got "{a:1}")',
			])
		}

		const env = E.load({ B: 'No', U: 'https://a.co', M: 'a@b.co', H: '[::1]', J: '[1]' })
		expect(env).toEqual({ B: false, U: 'https://a.co', M: 'a@b.co', H: '[::1]', J: [1] })
	})

	test('built-in parsers edge cases', () => {
		const valid = <T>(decorator: Var.Decorator<T>, raw: string) => {
			class E extends Environment {
				@(decorator as Var.Decorator<any>) V!: T
			}
			return E.load({ V: raw }).V
		}
		const invalid = (decorator: Var.Decorator<any>, raw: string) => {
			class E extends Environment {
				@decorator V!: any
			}
			return expect(() => E.load({ V: raw })).toThrow(EnvValidationError)
		}

		expect(valid(Var.Bool(), ' On ')).toBe(true)
		expect(valid(Var.Bool(), 'OFF')).toBe(false)
		invalid(Var.Bool(), 'y')

		expect(valid(Var.Url(), ' https://a.co/path ')).toBe('https://a.co/path')
		expect(valid(Var.Url(), 'postgres://user:pass@db:5432/app')).toBe('postgres://user:pass@db:5432/app')
		invalid(Var.Url(), 'localhost:3000')
		invalid(Var.Url(), 'mailto:a@b.co')

		expect(valid(Var.Email(), ' a.b+c@sub.example.co ')).toBe('a.b+c@sub.example.co')
		for (const raw of ['a@b', 'a@.b.co', 'a@b..co', 'a@-b.co', 'a b@c.co', 'a@b@c.co']) invalid(Var.Email(), raw)

		for (const raw of ['localhost', 'db_1', 'my-service.internal', 'example.com.', '127.0.0.1', '::1', '[::1]']) {
			expect(valid(Var.Host(), raw)).toBe(raw)
		}
		for (const raw of [
			'...',
			'-',
			'a..b',
			'-a.com',
			'a-.com',
			'999.0.0.1',
			'[127.0.0.1]',
			'a b',
			'a/b',
			'a'.repeat(64),
		]) {
			invalid(Var.Host(), raw)
		}
	})

	test('decorators check property types', () => {
		const s = Symbol('s')

		// Compiles: valid declarations.
		class Valid extends Environment {
			@Var.Str() A!: string
			@Var.Str() B: string = 'production'
			@Var.Str({ choices: ['a', 'b'] }) C!: 'a' | 'b'
			@Var.Str({ choices: ['a', 'b'] }) D!: string
			@Var.Str({ requiredWhen: () => false }) E?: string
			@Var.Json() F!: { a: number }
			@Var.Custom((raw) => raw.split(',')) G!: string[];
			@Var.Num({ name: 'S' }) [s]: number = 1
		}
		expect(Valid.load({ A: 'a', C: 'a', D: 'b', F: '{}', G: 'x' })[s]).toBe(1)

		// Type errors only: never initialized.
		class Invalid {
			// @ts-expect-error parsed number is not a string
			@Var.Num() A!: string
			// @ts-expect-error parsed string is not a number
			@Var.Str() B!: number
			// @ts-expect-error any string could be parsed, use `choices`
			@Var.Str() C!: 'a' | 'b'
			// @ts-expect-error JSON type mismatch
			@Var.Json<{ a: number }>() F!: { a: string }
			// @ts-expect-error decorated properties must be public
			@Var.Num() private G!: number
		}
		expect(Invalid).toBeDefined()
	})

	test('property initializers are default values', () => {
		class Base extends Environment {
			@Var.Str() HOST = 'localhost'
		}
		class E extends Base {
			@Var.Port() PORT = 3000
			@Var.Str() OTHER!: string
			@Var.Bool() F: boolean = false
			@Var.Num({ requiredWhen: (env: E) => env.F }) N?: number = 1
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

	test('parsed JSON is deeply frozen', () => {
		class E extends Environment {
			@Var.Json() CONFIG!: { a: { b: number }; list: number[] }
		}
		const env = E.load({ CONFIG: '{"a":{"b":1},"list":[1]}' })
		expect(() => (env.CONFIG.a.b = 2)).toThrow(TypeError)
		expect(() => env.CONFIG.list.push(2)).toThrow(TypeError)
	})

	test('several env decorators on the same property are rejected', () => {
		expect(() => {
			class E extends Environment {
				@Var.Str()
				@Var.Num()
				A!: any
			}
			return E
		}).toThrow('"E.A" cannot have several env decorators.')
	})

	test('getters and methods using #private fields work in predicates', () => {
		class E extends Environment {
			#region = 'eu'
			@Var.Str() A: string = 'x'
			@Var.Str({ requiredWhen: (env: E) => env.isEurope }) GDPR?: string

			get isEurope() {
				return this.#region === 'eu'
			}

			label() {
				return `${this.A}-${this.#region}`
			}
		}

		expect(() => E.load({})).toThrow(/GDPR \(missing\)/)
		const env = E.load({ GDPR: 'dpo@a.co' })
		expect(env.label()).toBe('x-eu')
		expect(Object.keys(env)).toEqual(['A', 'GDPR'])
	})

	test('classes with private members are assignable from the env', () => {
		class E extends Environment {
			@Var.Str() HOST: string = 'h'
			#secret = 1
			private helper() {
				return this.HOST + this.#secret
			}
			get upper() {
				return this.helper().toUpperCase()
			}
		}
		const env: E = E.load({})
		expect(env.upper).toBe('H1')
	})

	test('static properties, methods and accessors are rejected', () => {
		const define = (decorate: () => unknown) => expect(decorate)

		define(() => {
			class S {
				// @ts-expect-error static
				@Var.Str() static FOO: string
			}
			return S
		}).toThrow('"S.FOO" cannot be static.')

		define(() => {
			class G {
				// @ts-expect-error accessor
				@Var.Str() get G() {
					return 'g'
				}
			}
			return G
		}).toThrow('"G.G" must be a property, not a method or accessor.')

		define(() => {
			class M {
				// @ts-expect-error method
				@Var.Custom(() => () => 1) m() {
					return 1
				}
			}
			return M
		}).toThrow('"M.m" must be a property, not a method or accessor.')
	})

	test('symbol keys need a name', () => {
		const S = Symbol('S')
		expect(() => {
			class E extends Environment {
				@Var.Str() [S]!: string
			}
			return E
		}).toThrow('"E.Symbol(S)" needs a `name` option, as a symbol property.')

		class Named extends Environment {
			@Var.Str({ name: 'S' }) [S]!: string
		}
		expect(Named.load({ S: 'v' })[S]).toBe('v')
	})

	test('source prototype keys are ignored', () => {
		class E extends Environment {
			@Var.Str({ name: 'toString' }) X?: string
		}
		expect(() => E.load({})).toThrow(/toString \(missing\)/)
	})

	test('defaults are normalized and JSON defaults are copied before freezing', () => {
		const def = { a: 1 }
		class E extends Environment {
			@Var.Host() H: string = ' localhost '
			@Var.Json() J: { a: number } = def
		}
		const env = E.load({})
		expect(env.H).toBe('localhost')
		expect(env.J).toEqual({ a: 1 })
		expect(Object.isFrozen(env.J)).toBe(true)
		expect(Object.isFrozen(def)).toBe(false)
	})

	test('numbers must be finite, and Num and Port can be narrowed with choices', () => {
		class E extends Environment {
			@Var.Num() N!: number
		}
		expect(() => E.load({ N: '1e400' })).toThrow(/must be a finite decimal number/)

		class C extends Environment {
			@Var.Num({ choices: [1, 2] }) X!: 1 | 2
			@Var.Port({ choices: [80, 443] }) P!: 80 | 443
		}
		expect(C.load({ X: '2', P: '443' })).toEqual({ X: 2, P: 443 })
	})

	test('predicates do not see unvalidated initializers of variables processed later', () => {
		class E extends Environment {
			@Var.Str({ requiredWhen: (env: E) => env.MODE === 'remote' }) URL?: string
			@Var.Str({ requiredWhen: () => true }) MODE?: string = 'remote'
		}
		expect(E.load({ MODE: 'local' })).toEqual({ MODE: 'local' })
		expect(E.load({})).toEqual({ MODE: 'remote' })
	})

	test('requiredWhen is type checked against the class, and requires an optional property', () => {
		class Other {
			y!: number
		}
		class E extends Environment {
			// @ts-expect-error wrong class
			@Var.Str({ requiredWhen: (env: Other) => env.y > 1 }) A?: string
			// @ts-expect-error property must be optional
			@Var.Bool({ requiredWhen: () => true }) B!: boolean
			@Var.Str({ choices: ['a', 'b'], requiredWhen: (env: E) => !!env.A }) C?: 'a' | 'b'
		}
		expect(E).toBeDefined()

		class F extends Environment {
			@Var.Bool() ENABLED = false
			@Var.Url({ requiredWhen: (env: F) => env.ENABLED }) D?: string
		}
		expect(F.load({}).D).toBeUndefined()
	})

	test('whitespace-only values are missing for trimmed types', () => {
		class E extends Environment {
			@Var.Port() PORT: number = 3000
			@Var.Bool() B: boolean = false
			@Var.Str() S: string = 'x'
		}
		expect(E.load({ PORT: '  ', B: ' ', S: ' ' })).toEqual({ PORT: 3000, B: false, S: ' ' })

		class R extends Environment {
			@Var.Num() N!: number
		}
		expect(() => R.load({ N: '\t' })).toThrow(/N \(missing\)/)
	})

	test('null initializers are not defaults', () => {
		class E extends Environment {
			@Var.Num({ requiredWhen: () => false }) N?: number | null = null
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

	test('sensitive values are masked in logs and serialization', () => {
		class E extends Environment {
			@Var.Port() PORT = 3000
			@Sensitive() @Var.Url() DATABASE_URL!: string
			@Sensitive() @Var.Json() CREDS!: { key: string }

			get isLocal() {
				return this.DATABASE_URL.includes('localhost')
			}
		}

		const env = E.load({ DATABASE_URL: 'postgres://user:s3cr3t@localhost/app', CREDS: '{"key":"s3cr3t"}' })
		expect(env.DATABASE_URL).toBe('postgres://user:s3cr3t@localhost/app')
		expect(env.isLocal).toBe(true)

		expect(JSON.parse(JSON.stringify(env))).toEqual({ PORT: 3000, DATABASE_URL: '***', CREDS: '***' })
		expect(inspect(env)).toBe("E { PORT: 3000, DATABASE_URL: '***', CREDS: '***' }")
		expect(JSON.stringify({ env })).not.toContain('s3cr3t')
	})

	test('several names for a variable, the first one set is used', () => {
		class E extends Environment {
			@Var.Url({ name: ['DATABASE_URL', 'DB_URL'] }) DATABASE_URL!: string
			@Var.Port({ name: ['PORT', 'APP_PORT'] }) PORT = 3000
		}

		expect(E.load({ DB_URL: 'https://old' }).DATABASE_URL).toBe('https://old')
		expect(E.load({ DATABASE_URL: 'https://new', DB_URL: 'https://old' }).DATABASE_URL).toBe('https://new')
		expect(E.load({ DATABASE_URL: ' ', DB_URL: 'https://old' }).DATABASE_URL).toBe('https://old')
		expect(E.load({ DB_URL: 'https://old', APP_PORT: '80' }).PORT).toBe(80)
		expect(() => E.load({})).toThrow('DATABASE_URL (missing): missing required value (DATABASE_URL, DB_URL)')
		expect(() => E.load({ DB_URL: 'nope' })).toThrow('DB_URL (invalid): "DB_URL" must be a valid URL (got "nope")')

		expect(() => {
			class N extends Environment {
				@Var.Str({ name: [] }) A!: string
			}
			return N
		}).toThrow('"N.A" needs at least one name.')
	})

	test('lists', () => {
		class E extends Environment {
			@Var.List() HOSTS!: string[]
			@Var.List(Var.Port) PORTS!: number[]
			@Var.List(Var.Email, { separator: ';' }) ADMINS: string[] = ['admin@a.co']
			@Var.List(Var.Bool, { requiredWhen: () => false }) FLAGS?: boolean[]
		}

		const env = E.load({ HOSTS: ' a , b,, c ,', PORTS: '80, 443' })
		expect(env).toEqual({ HOSTS: ['a', 'b', 'c'], PORTS: [80, 443], ADMINS: ['admin@a.co'] })
		expect(Object.isFrozen(env.HOSTS)).toBe(true)
		expect(Object.isFrozen(env.ADMINS)).toBe(true)
		expect(E.load({ HOSTS: 'a', PORTS: '1', ADMINS: 'x@a.co; y@a.co' }).ADMINS).toEqual(['x@a.co', 'y@a.co'])

		expect(() => E.load({ HOSTS: ' ', PORTS: '1' })).toThrow(/HOSTS \(missing\)/)
		expect(() => E.load({ HOSTS: 'a', PORTS: '80,99999' })).toThrow(
			'PORTS (invalid): "PORTS[1]" must be a valid port number (1-65535) (got "80,99999")'
		)

		class T {
			// @ts-expect-error list of numbers is not a list of strings
			@Var.List(Var.Port) A!: string[]
		}
		expect(T).toBeDefined()
	})

	describe('secret files', () => {
		// Applies the decorator to a subclass, since directories are created at runtime.
		const withSecrets = <T extends Function & { prototype: Environment }>(
			cls: T,
			...dirs: (string | undefined)[]
		) => {
			const Sub = class extends (cls as any) {}
			Secrets(dirs)(Sub as any)
			return Sub as unknown as T
		}

		let credentials: string
		let secrets: string

		beforeAll(() => {
			credentials = mkdtempSync(join(tmpdir(), 'reflet-env-credentials-'))
			secrets = mkdtempSync(join(tmpdir(), 'reflet-env-secrets-'))
			writeFileSync(join(credentials, 'DB_PASSWORD'), 's3cr3t\n')
			writeFileSync(join(credentials, 'PORT'), '8080\r\n')
			writeFileSync(join(credentials, 'BAD_PORT'), 's3cr3t-port\n')
			writeFileSync(join(credentials, 'EMPTY'), '\n')
			writeFileSync(join(secrets, 'api-token'), 'tok3n')
			mkdirSync(join(secrets, 'DIRECTORY'))
		})

		afterAll(() => {
			rmSync(credentials, { recursive: true, force: true })
			rmSync(secrets, { recursive: true, force: true })
		})

		test('systemd credentials are read explicitly from $CREDENTIALS_DIRECTORY', () => {
			class E extends Environment {
				@Sensitive() @Var.Str() DB_PASSWORD!: string
				@Var.Port() PORT!: number
			}
			const source = { CREDENTIALS_DIRECTORY: credentials }

			@Secrets(source.CREDENTIALS_DIRECTORY)
			class Decorated extends E {}
			expect(Decorated.load(source)).toEqual({ DB_PASSWORD: 's3cr3t', PORT: 8080 })

			// Not implicitly, and undefined outside of systemd.
			expect(() => E.load(source)).toThrow(/DB_PASSWORD \(missing\)/)
			expect(() => withSecrets(E, undefined).load({})).toThrow(/DB_PASSWORD \(missing\)/)
		})

		test('environment variables take precedence over secret files', () => {
			class E extends Environment {
				@Var.Str() DB_PASSWORD!: string
			}
			expect(withSecrets(E, credentials).load({ DB_PASSWORD: 'env' }).DB_PASSWORD).toBe('env')
			expect(withSecrets(E, credentials).load({ DB_PASSWORD: '' }).DB_PASSWORD).toBe('s3cr3t')
		})

		test('several directories, and file names among variable names', () => {
			class E extends Environment {
				@Var.Str({ name: ['API_TOKEN', 'api-token'] }) API_TOKEN!: string
			}
			expect(withSecrets(E, secrets).load({}).API_TOKEN).toBe('tok3n')
			expect(withSecrets(E, undefined, credentials, secrets).load({}).API_TOKEN).toBe('tok3n')

			// A single directory, or an array of directories.
			@Secrets(secrets)
			class Single extends E {}
			expect(Single.load({}).API_TOKEN).toBe('tok3n')
			@Secrets([undefined, credentials, secrets])
			class Several extends E {}
			expect(Several.load({}).API_TOKEN).toBe('tok3n')
			@Secrets(undefined)
			class Undefined extends E {}
			expect(() => Undefined.load({})).toThrow(/API_TOKEN \(missing\)/)

			// @ts-expect-error directories as an array, to leave room for options
			expect(() => Secrets(credentials, secrets)).toBeDefined()
			// @ts-expect-error a directory is required, or an empty array
			expect(() => Secrets()).toBeDefined()
			expect(() => withSecrets(E, join(secrets, 'missing')).load({})).toThrow(/API_TOKEN \(missing\)/)
		})

		test('empty secret files are missing, and defaults apply', () => {
			class E extends Environment {
				@Var.Str() EMPTY = 'default'
			}
			expect(withSecrets(E, credentials).load({}).EMPTY).toBe('default')

			class R extends Environment {
				@Var.Str() EMPTY!: string
			}
			expect(() => withSecrets(R, credentials, secrets).load({})).toThrow(
				`EMPTY (missing): missing required value (secret files in ${credentials}, ${secrets})`
			)
		})

		test('values of secret files are never included in error messages', () => {
			class E extends Environment {
				@Var.Port({ name: 'BAD_PORT' }) PORT!: number
			}
			try {
				withSecrets(E, credentials).load({})
				fail('should throw')
			} catch (err: any) {
				expect(err.message).toContain('BAD_PORT (invalid): "BAD_PORT" must be a finite decimal number')
				expect(err.message).not.toContain('s3cr3t')
			}
		})

		test('empty secret files are skipped for the next directory or name', () => {
			const first = mkdtempSync(join(tmpdir(), 'reflet-env-first-'))
			const second = mkdtempSync(join(tmpdir(), 'reflet-env-second-'))
			try {
				writeFileSync(join(first, 'TOKEN'), '\n')
				writeFileSync(join(second, 'TOKEN'), 'real')
				writeFileSync(join(first, 'OLD_TOKEN'), 'old')

				class E extends Environment {
					@Var.Str({ name: ['TOKEN', 'OLD_TOKEN'] }) TOKEN!: string
				}
				expect(withSecrets(E, first, second).load({}).TOKEN).toBe('real')
				expect(withSecrets(E, first).load({}).TOKEN).toBe('old')
			} finally {
				rmSync(first, { recursive: true, force: true })
				rmSync(second, { recursive: true, force: true })
			}
		})

		test('subclasses inherit secret directories, unless they define their own', () => {
			class E extends Environment {
				@Var.Str() DB_PASSWORD!: string
			}
			const Parent = withSecrets(E, credentials)
			class Child extends Parent {}
			expect(Child.load({}).DB_PASSWORD).toBe('s3cr3t')

			@Secrets([])
			class TestEnv extends Parent {}
			expect(() => TestEnv.load({})).toThrow(/DB_PASSWORD \(missing\)/)

			expect(() => {
				@Secrets('/a')
				@Secrets('/b')
				class Twice extends Environment {}
				return Twice
			}).toThrow('"Twice" cannot have several @Secrets decorators.')

			// @ts-expect-error not an environment
			@Secrets('/a')
			class NotEnv {}
			expect(NotEnv).toBeDefined()
		})

		test('empty secret files are values with allowEmpty', () => {
			class E extends Environment {
				@Var.Str({ allowEmpty: true }) EMPTY = 'default'
			}
			expect(withSecrets(E, credentials, secrets).load({}).EMPTY).toBe('')
		})

		test('property secret directories override the class ones', () => {
			class E extends Environment {
				@Var.Str() DB_PASSWORD!: string
				@Var.Str({ name: ['API_TOKEN', 'api-token'] }) API_TOKEN!: string
			}
			const WithBoth = withSecrets(E, credentials)
			class Child extends WithBoth {
				@Secrets(secrets) @Var.Str({ name: ['API_TOKEN', 'api-token'] }) API_TOKEN!: string
				@Secrets([]) @Var.Str() DB_PASSWORD!: string
			}
			expect(WithBoth.load({ API_TOKEN: 'env' }).DB_PASSWORD).toBe('s3cr3t')
			expect(() => Child.load({})).toThrow(/DB_PASSWORD \(missing\)/)
			expect(Child.load({ DB_PASSWORD: 'env' }).API_TOKEN).toBe('tok3n')
		})

		test('revealed characters of secret files in error messages', () => {
			class E extends Environment {
				@Sensitive({ reveal: 2 }) @Var.Port({ name: 'BAD_PORT' }) REVEALED!: number
			}
			expect(() => withSecrets(E, credentials).load({})).toThrow(
				'"BAD_PORT" must be a finite decimal number (got "***rt")'
			)
		})

		test('unreadable secret files are reported', () => {
			class E extends Environment {
				@Var.Str() DIRECTORY!: string
				@Var.Str() OTHER!: string
			}
			try {
				withSecrets(E, secrets).load({})
				fail('should throw')
			} catch (err: any) {
				expect(err.errors.map((e: any) => [e.name, e.kind])).toEqual([
					['DIRECTORY', 'invalid'],
					['OTHER', 'missing'],
				])
				expect(err.errors[0].message).toMatch(/^cannot read secret file ".*DIRECTORY": EISDIR/)
			}
		})
	})

	test('explicit type arguments', () => {
		class E extends Environment {
			@Var.Bool() F = false
			@Var.Str<'x' | 'y'>({ choices: ['x', 'y'] }) S: 'x' | 'y' = 'x'
			@Var.Json<{ retries: number }>({ requiredWhen: (env: E) => env.F }) J?: { retries: number }
			@Var.Custom<Date>((raw) => new Date(raw), { requiredWhen: (env: E) => env.F }) D?: Date
			@Var.List<number>(Var.Port, { requiredWhen: (env: E) => env.F }) L?: number[]
		}
		expect(E.load({})).toEqual({ F: false, S: 'x' })
		expect(() => E.load({ F: 'true' })).toThrow(/J \(missing\)[\s\S]*D \(missing\)[\s\S]*L \(missing\)/)

		class Invalid {
			// @ts-expect-error narrowing a string requires choices
			@Var.Str<'json' | 'text'>() A!: 'json' | 'text'
			// @ts-expect-error narrowing a number requires choices
			@Var.Port<80>() B!: 80
			// @ts-expect-error narrowing a list requires a compatible item type
			@Var.List<'a' | 'b'>() C!: ('a' | 'b')[]
			// @ts-expect-error narrowing a list requires a compatible item type
			@Var.List<'a' | 'b'>(Var.Str) D!: ('a' | 'b')[]
		}
		expect(Invalid).toBeDefined()
	})

	test('list defaults are checked by their item type', () => {
		class E extends Environment {
			@Var.List(Var.Email) ADMINS: string[] = ['not-an-email']
			@Var.List(Var.Port) PORTS = [99999]
		}
		try {
			E.load({})
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'invalid default value: "ADMINS[0]" must be a valid email (got ["not-an-email"])',
				'invalid default value: "PORTS[0]" must be a valid port number (1-65535) (got [99999])',
			])
		}

		class F extends Environment {
			@Var.List(Var.Host) HOSTS = [' localhost ']
			@Var.List({ parse: (raw) => Number(raw) }) N = [1]
		}
		expect(F.load({})).toEqual({ HOSTS: ['localhost'], N: [1] })
	})

	test('a default value makes a conditional variable never missing', () => {
		class E extends Environment {
			@Var.Bool() F = true
			@Var.Num({ requiredWhen: (env: E) => env.F }) N?: number = 5
		}
		expect(E.load({}).N).toBe(5)
	})

	test('allowEmpty: an empty value is a value, not a missing variable', () => {
		class E extends Environment {
			@Var.Str({ allowEmpty: true }) PREFIX = 'app'
			@Var.List(Var.Url, { allowEmpty: true }) ORIGINS = ['https://a.com']
			@Var.Custom((raw) => raw.length, { allowEmpty: true }) LENGTH = -1
			@Var.Str({ allowEmpty: true, name: ['NEW', 'OLD'] }) RENAMED = 'default'
		}

		expect(E.load({})).toEqual({ PREFIX: 'app', ORIGINS: ['https://a.com'], LENGTH: -1, RENAMED: 'default' })
		expect(E.load({ PREFIX: '', ORIGINS: '', LENGTH: '', NEW: '', OLD: 'old' })).toEqual({
			PREFIX: '',
			ORIGINS: [],
			LENGTH: 0,
			RENAMED: '',
		})
		expect(E.load({ PREFIX: ' ', ORIGINS: ' , ' })).toMatchObject({ PREFIX: ' ', ORIGINS: [] })

		class Required extends Environment {
			@Var.Str({ allowEmpty: true }) PREFIX!: string
		}
		expect(Required.load({ PREFIX: '' }).PREFIX).toBe('')
		expect(() => Required.load({})).toThrow(/PREFIX \(missing\)/)

		class Invalid {
			// @ts-expect-error an empty number is never valid
			@Var.Num({ allowEmpty: true }) N!: number
			// @ts-expect-error an empty URL is never valid
			@Var.Url({ allowEmpty: true }) U!: string
		}
		expect(Invalid).toBeDefined()
	})

	test('pattern of string variables', () => {
		class E extends Environment {
			@Var.Str({ pattern: /^sk_live_/ }) API_KEY!: string
			@Sensitive() @Var.Str({ pattern: /^sk_/ }) SECRET!: string
			@Var.Str({ pattern: /a/g }) GLOBAL = 'a'
		}

		expect(E.load({ API_KEY: 'sk_live_123', SECRET: 'sk_1' }).API_KEY).toBe('sk_live_123')
		try {
			E.load({ API_KEY: 'sk_test_123', SECRET: 's3cr3t' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"API_KEY" must match /^sk_live_/ (got "sk_test_123")',
				'"SECRET" must match /^sk_/',
			])
		}

		// Stateful global pattern gives the same result on each load.
		for (let i = 0; i < 3; i++)
			expect(E.load({ API_KEY: 'sk_live_1', SECRET: 'sk_1', GLOBAL: 'aa' }).GLOBAL).toBe('aa')

		class Default extends Environment {
			@Var.Str({ pattern: /^sk_/ }) API_KEY = 'nope'
		}
		expect(() => Default.load({})).toThrow('API_KEY (invalid): invalid default value: "API_KEY" must match /^sk_/')

		class Invalid {
			// @ts-expect-error pattern is for strings
			@Var.Email({ pattern: /a/ }) A!: string
		}
		expect(Invalid).toBeDefined()
	})

	test('min, max and int of number variables', () => {
		class E extends Environment {
			@Var.Num({ min: 1, max: 64, int: true }) WORKERS = 4
			@Var.Num({ min: 0, max: 1 }) RATIO = 0.5
			@Var.Port({ min: 1024 }) PORT = 3000
		}

		expect(E.load({ WORKERS: '64', RATIO: '0', PORT: '1024' })).toEqual({ WORKERS: 64, RATIO: 0, PORT: 1024 })
		try {
			E.load({ WORKERS: '1.5', RATIO: '2', PORT: '80' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"WORKERS" must be an integer (got "1.5")',
				'"RATIO" must be at most 1 (got "2")',
				'"PORT" must be at least 1024 (got "80")',
			])
		}
		expect(() => E.load({ WORKERS: '0' })).toThrow('"WORKERS" must be at least 1')

		class Default extends Environment {
			@Var.Num({ max: 10 }) N = 11
		}
		expect(() => Default.load({})).toThrow('N (invalid): invalid default value: "N" must be at most 10 (got 11)')

		class Invalid {
			// @ts-expect-error bounds are for numbers
			@Var.Str({ min: 1 }) A!: string
		}
		expect(Invalid).toBeDefined()
	})

	test('standard decorators are reported', () => {
		// Arguments of a standard field decorator, when "experimentalDecorators" is not enabled.
		const standard = Var.Str() as unknown as (value: undefined, context: object) => void
		expect(() => standard(undefined, { kind: 'field', name: 'A' })).toThrow(
			'@reflet/env decorators require the "experimentalDecorators" TypeScript option.'
		)
		const sensitive = Sensitive() as unknown as (value: undefined, context: object) => void
		expect(() => sensitive(undefined, { kind: 'field', name: 'A' })).toThrow('"experimentalDecorators"')
	})

	test('minLength and maxLength of string variables', () => {
		class E extends Environment {
			@Sensitive() @Var.Str({ minLength: 32 }) COOKIE_SECRET!: string
			@Var.Str({ maxLength: 3 }) CODE = 'abc'
		}

		expect(E.load({ COOKIE_SECRET: 'c'.repeat(32) }).COOKIE_SECRET).toHaveLength(32)
		try {
			E.load({ COOKIE_SECRET: 's3cr3t', CODE: 'abcd' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"COOKIE_SECRET" must be at least 32 characters',
				'"CODE" must be at most 3 characters (got "abcd")',
			])
		}

		class Default extends Environment {
			@Var.Str({ maxLength: 3 }) CODE = 'abcd'
		}
		expect(() => Default.load({})).toThrow('invalid default value: "CODE" must be at most 3 characters')
	})

	test('parseDefault of custom variables', () => {
		const root = mkdtempSync(join(tmpdir(), 'reflet-env-root-'))
		try {
			mkdirSync(join(root, 'temp'))
			const folder = (raw: string, name: string) => {
				const path = join(root, raw)
				if (!existsSync(path)) throw new Error(`"${name}" folder "${path}" does not exist`)
				return path
			}

			class E extends Environment {
				@Var.Custom(folder, { parseDefault: true }) SHARED_DIR = 'temp'
				@Var.Custom(folder) RAW_DIR = 'not-parsed'
			}
			expect(E.load({})).toEqual({ SHARED_DIR: join(root, 'temp'), RAW_DIR: 'not-parsed' })
			expect(E.load({ SHARED_DIR: '.' }).SHARED_DIR).toBe(join(root, '.'))

			class Missing extends Environment {
				@Var.Custom(folder, { parseDefault: true }) SHARED_DIR = 'nope'
			}
			expect(() => Missing.load({})).toThrow(
				/SHARED_DIR \(invalid\): invalid default value: "SHARED_DIR" folder ".*nope" does not exist/
			)
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('Sensitive decorator', () => {
		class E extends Environment {
			@Var.Str() @Sensitive() BELOW!: string
			@Sensitive() @Var.Str() ABOVE!: string
			@Var.Str() PUBLIC!: string
		}
		const env = E.load({ BELOW: 'b', ABOVE: 'a', PUBLIC: 'p' })
		expect(inspect(env)).toBe("E { BELOW: '***', ABOVE: '***', PUBLIC: 'p' }")

		@Sensitive()
		class All extends Environment {
			@Var.Port() PORT!: number
			readonly ROOT = '/app'
		}
		expect(JSON.stringify(All.load({ PORT: '80' }))).toBe('{"ROOT":"/app","PORT":"***"}')
		expect(() => All.load({ PORT: 's3cr3t' })).toThrow(/"PORT" must be a finite decimal number$/)

		class Child extends E {
			@Var.Str({ minLength: 2 }) BELOW!: string
		}
		expect(inspect(Child.load({ BELOW: 'bb', ABOVE: 'a', PUBLIC: 'p' }))).toContain("BELOW: '***'")

		class NotVariable extends Environment {
			@Sensitive() X!: string
		}
		expect(() => NotVariable.load({})).toThrow(
			'"NotVariable.X" has @Sensitive or @Secrets, but no variable decorator.'
		)

		expect(() => {
			class Twice extends Environment {
				@Sensitive() @Sensitive() @Var.Str() A!: string
			}
			return Twice
		}).toThrow('"Twice.A" cannot have several @Sensitive decorators.')

		expect(() => {
			class Static extends Environment {
				@Sensitive() static A: string
			}
			return Static
		}).toThrow('"Static.A" cannot be static.')
	})

	test('UnsetSensitive decorator', () => {
		@UnsetSensitive()
		class E extends Environment {
			@Sensitive() @Var.Str({ name: ['REFLET_TOKEN', 'REFLET_OLD_TOKEN'] }) TOKEN!: string
			@Var.Str() REFLET_PUBLIC!: string
		}
		class Child extends E {}

		const vars = { REFLET_TOKEN: 't', REFLET_OLD_TOKEN: 'o', REFLET_PUBLIC: 'p' }
		try {
			// An explicit source is left untouched.
			const source = { ...vars }
			E.load(source)
			expect(source).toEqual(vars)

			Object.assign(process.env, vars)
			expect(Child.load().TOKEN).toBe('t')
			expect(process.env.REFLET_TOKEN).toBeUndefined()
			expect(process.env.REFLET_OLD_TOKEN).toBeUndefined()
			expect(process.env.REFLET_PUBLIC).toBe('p')

			// Nothing is removed when loading fails.
			Object.assign(process.env, vars)
			delete process.env.REFLET_PUBLIC
			expect(() => E.load()).toThrow(EnvValidationError)
			expect(process.env.REFLET_TOKEN).toBe('t')
		} finally {
			for (const name of Object.keys(vars)) delete process.env[name]
		}
	})

	test('Var.Bytes', () => {
		type BlindIndexSecret = Buffer & { __brand: 'BlindIndexSecret' }
		class E extends Environment {
			@Var.Bytes({ length: 4 }) UTF8!: Buffer
			@Var.Bytes({ encoding: 'hex', minLength: 2 }) HEX!: Buffer
			@Var.Bytes({ encoding: 'base64', maxLength: 3 }) B64!: Buffer
			@Var.Bytes({ encoding: 'base64url' }) B64URL!: Buffer
			@Var.Bytes<BlindIndexSecret>({ minLength: 1 }) BRANDED!: BlindIndexSecret
			@Var.List(Var.Bytes) LIST!: Buffer[]
			@Var.Bytes() DEFAULT = Buffer.from('d')
		}
		const env = E.load({ UTF8: 'abcd', HEX: 'abcd', B64: 'YWJj', B64URL: 'YWJj-_', BRANDED: 'x', LIST: 'a,b' })
		expect(env).toMatchObject({
			UTF8: Buffer.from('abcd'),
			HEX: Buffer.from([0xab, 0xcd]),
			B64: Buffer.from('abc'),
			B64URL: Buffer.from('YWJj-_', 'base64url'),
			LIST: [Buffer.from('a'), Buffer.from('b')],
			DEFAULT: Buffer.from('d'),
		})

		try {
			E.load({ UTF8: 'abc', HEX: 'abzz', B64: 'ab!c', B64URL: 'a+b', BRANDED: 'x', LIST: 'a' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"UTF8" must be 4 bytes (got "abc")',
				'"HEX" must be valid hex (got "abzz")',
				'"B64" must be valid base64 (got "ab!c")',
				'"B64URL" must be valid base64url (got "a+b")',
			])
		}
		expect(() => E.load({ UTF8: 'abcd', HEX: 'ab', B64: 'YWJjZA==', B64URL: '', BRANDED: 'x', LIST: 'a' })).toThrow(
			/HEX \(invalid\): "HEX" must be at least 2 bytes[\s\S]*B64 \(invalid\): "B64" must be at most 3 bytes/
		)

		class Invalid {
			// @ts-expect-error bytes are buffers
			@Var.Bytes() A!: string
		}
		expect(Invalid).toBeDefined()
	})

	test('Var.Type', () => {
		const parseCsvLine: (raw: string, name: string) => string[] = (raw) => raw.split(';')
		const Upper = Var.Type((raw) => raw.toUpperCase())
		const Csv = Var.Type(parseCsvLine)

		class E extends Environment {
			@Var.Bool() F = false
			@Upper() A!: string
			@Upper({ parseDefault: true }) B = 'b'
			@Upper({ requiredWhen: (env: E) => env.F }) C?: string
			@Var.List(Upper) D: string[] = []
			@Csv() E!: string[]
		}
		expect(E.load({ A: 'a', D: 'x,y', E: '1;2' })).toEqual({
			F: false,
			A: 'A',
			B: 'B',
			D: ['X', 'Y'],
			E: ['1', '2'],
		})
		expect(() => E.load({ F: 'true', A: 'a', E: '' })).toThrow(/C \(missing\)/)
		expect(Upper.parse('x', 'X')).toBe('X')

		class Invalid {
			// @ts-expect-error parsed string is not a number
			@Upper() A!: number
		}
		expect(Invalid).toBeDefined()
	})

	test('Sensitive reveal option', () => {
		@Sensitive({ reveal: 2 })
		class E extends Environment {
			@Sensitive({ reveal: 4 }) @Var.Str() STRIPE_KEY!: string
			@Var.Str() REVEALED_BY_CLASS!: string
			@Sensitive() @Var.Str() PASSWORD!: string
			@Sensitive({ reveal: 4 }) @Var.Str() SHORT!: string
			@Sensitive({ reveal: 4 }) @Var.Bytes({ encoding: 'hex' }) KEY!: Buffer
			@Sensitive({ reveal: 4 }) @Var.Port() PORT!: number
		}

		const env = E.load({
			STRIPE_KEY: 'sk_live_1234567890abcd4242',
			REVEALED_BY_CLASS: 'abcdefghij',
			PASSWORD: 'p4ssw0rd-long-enough',
			SHORT: 'abc4242',
			KEY: '00112233445566778899aabbccc0ffee',
			PORT: '80',
		})
		expect(JSON.parse(JSON.stringify(env))).toEqual({
			STRIPE_KEY: '***4242',
			REVEALED_BY_CLASS: '***ij',
			PASSWORD: '***',
			SHORT: '***',
			KEY: '***ffee',
			PORT: '***',
		})

		try {
			E.load({
				STRIPE_KEY: 'sk_live_1234567890abcd4242',
				REVEALED_BY_CLASS: 'x',
				PASSWORD: 'p',
				SHORT: 's',
				KEY: 'zz',
				PORT: 'nope-nope-nope-nope',
			})
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"KEY" must be valid hex (got "***")',
				'"PORT" must be a finite decimal number (got "***nope")',
			])
		}

		class Choices extends Environment {
			@Sensitive({ reveal: 3 }) @Var.Str({ choices: ['sk_live_abcdef123'] }) KEY!: string
			@Sensitive() @Var.Str({ choices: ['a'] }) HIDDEN!: string
		}
		expect(() => Choices.load({ KEY: 'sk_test_abcdef999', HIDDEN: 'b' })).toThrow(
			/must be one of \[sk_live_abcdef123\] \(got "\*\*\*999"\)\n - HIDDEN \(invalid\): must be one of \[a\]$/
		)

		expect(() => Sensitive({ reveal: 0 })).toThrow('@Sensitive "reveal" option must be a positive integer.')
		expect(() => Sensitive({ reveal: 1.5 })).toThrow('@Sensitive "reveal" option must be a positive integer.')
	})
})
