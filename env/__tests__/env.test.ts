import { inspect } from 'util'
import { Var, Environment, EnvValidationError } from '../src'

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
			@Var.Url({ sensitive: true }) DB!: string
			@Var.Json({ sensitive: true }) CREDS!: unknown
			@Var.Str({ sensitive: true, choices: ['a'] }) KEY!: 'a'
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
			@Var.Url({ sensitive: true }) U: string = 'nope'
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
			@Var.Url({ sensitive: true }) DATABASE_URL!: string
			@Var.Json({ sensitive: true }) CREDS!: { key: string }

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
})
