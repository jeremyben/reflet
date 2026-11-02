import { Var, Environment, Sensitive, Default } from '../src'

describe('Common options', () => {
	test('choices restrict the value', () => {
		class E extends Environment {
			@Var.Str({ choices: ['a', 'b'] as const }) X!: 'a' | 'b'
		}
		expect(E.load({ X: 'a' }).X).toBe('a')
		expect(() => E.load({ X: 'c' })).toThrow(/one of/)
	})

	test('the name option overrides the variable name', () => {
		class E extends Environment {
			@Var.Port({ name: 'APP_PORT' }) port!: number
		}
		expect(E.load({ APP_PORT: '80' })).toEqual({ port: 80 })
		expect(() => E.load({ port: '80' })).toThrow(/APP_PORT \(missing\)/)
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

	test('optional variables', () => {
		class E extends Environment {
			@Var.Str({ optional: true }) S3_BUCKET?: string
			@Var.Num({ optional: true }) N?: number = 5
		}
		const env = E.load({})
		expect(env.S3_BUCKET).toBeUndefined()
		expect(env.N).toBe(5)
		expect(E.load({ S3_BUCKET: 'b', N: '1' })).toEqual({ S3_BUCKET: 'b', N: 1 })
		expect(() => E.load({ N: 'x' })).toThrow(/N \(invalid\)/)

		class Invalid extends Environment {
			// @ts-expect-error the property must be optional
			@Var.Bool({ optional: true }) B!: boolean
			// @ts-expect-error optional must be true
			@Var.Str({ optional: false }) S!: string
		}
		expect(Invalid).toBeDefined()
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

	test('the validate option adds a validation', () => {
		const apiUrl = (url: string, name: string) => {
			if (!url.endsWith('/api')) throw new Error(`"${name}" must end with /api`)
			return url
		}
		class E extends Environment {
			@Var.Url({ validate: apiUrl }) API = 'https://example.com/api'
			@Var.Port({ validate: (port, name) => (port === 3000 ? reject(name) : port) }) ADMIN_PORT = 4000
			@Var.Str({ validate: (value) => value.toLowerCase() }) MODE = 'Remote'
			@Var.List(Var.Port, {
				validate: (ports, name) => (new Set(ports).size === ports.length ? ports : reject(name)),
			})
			PORTS: number[] = []
			@Var.Custom({ coerce: Number, validate: (n) => n * 2 }, { validate: (n) => n + 1 }) N = 1
		}
		const reject = (name: string): never => {
			throw new Error(`"${name}" is not allowed`)
		}
		// Defaults are validated as well, after the type validation.
		expect({ ...E.load({}) }).toEqual({
			API: 'https://example.com/api',
			ADMIN_PORT: 4000,
			MODE: 'remote',
			PORTS: [],
			N: 3,
		})
		expect(E.load({ N: '2', PORTS: '80,443' })).toMatchObject({ N: 5, PORTS: [80, 443] })

		try {
			E.load({ API: 'https://example.com', ADMIN_PORT: '3000', PORTS: '80,80' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"API" must end with /api (got "https://example.com")',
				'"ADMIN_PORT" is not allowed (got "3000")',
				'"PORTS" is not allowed (got "80,80")',
			])
		}
		// The type is validated first.
		expect(() => E.load({ API: 'nope' })).toThrow('"API" must be a valid URL')

		class D extends Environment {
			@Var.Url({ validate: apiUrl }) API = 'https://example.com'
		}
		expect(() => D.load({})).toThrow('invalid default value: "API" must end with /api')

		// @ts-expect-error the value is a number
		expect(() => Var.Port({ validate: (port: string) => port })).toBeDefined()
	})

	test('the validate option runs after choices, and must return a value', () => {
		// The validate option runs after choices, and must return the value.
		const seen: string[] = []
		class V extends Environment {
			@Var.Str({ choices: ['info', 'debug'], validate: (level) => (seen.push(level), level) }) LEVEL!:
				| 'info'
				| 'debug'
			@Var.Json({ validate: () => undefined }) CONF: unknown = {}
		}
		expect(() => V.load({ LEVEL: 'verbose' })).toThrow('must be one of [info, debug] (got "verbose")')
		expect(seen).toEqual([])
		expect(() => V.load({ LEVEL: 'info' })).toThrow(
			'invalid default value: "CONF" validate option must return a value'
		)
	})
})
