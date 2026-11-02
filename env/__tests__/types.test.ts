import * as fs from 'fs'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Var, Environment, EnvValidationError, Sensitive } from '../src'

describe('Variable types', () => {
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

	test('parsed JSON is deeply frozen', () => {
		class E extends Environment {
			@Var.Json() CONFIG!: { a: { b: number }; list: number[] }
		}
		const env = E.load({ CONFIG: '{"a":{"b":1},"list":[1]}' })
		expect(() => (env.CONFIG.a.b = 2)).toThrow(TypeError)
		expect(() => env.CONFIG.list.push(2)).toThrow(TypeError)
	})

	test('Var.List parses items', () => {
		class E extends Environment {
			@Var.List() HOSTS!: string[]
			@Var.List(Var.Port) PORTS!: number[]
			@Var.List(Var.Email, { separator: ';' }) ADMINS: string[] = ['admin@a.co']
			@Var.List(Var.Bool, { optional: true }) FLAGS?: boolean[]
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
			@Var.List(Var.Host) HOSTS = ['localhost']
			// Items of other parsable objects are not validated.
			@Var.List({ parse: (raw) => Number(raw) }) N = [-1]
		}
		expect(F.load({})).toEqual({ HOSTS: ['localhost'], N: [-1] })
	})

	test('Var.Bytes decodes and checks bytes', () => {
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

	test('Var.File and Var.Dir check paths', () => {
		const root = mkdtempSync(join(tmpdir(), 'reflet-env-paths-'))
		try {
			mkdirSync(join(root, 'temp'))
			writeFileSync(join(root, 'cert.pem'), 'cert')

			class E extends Environment {
				@Var.Dir({ base: root, writable: true }) SHARED_DIR = 'temp'
				@Var.File({ base: root, readable: true }) CERT!: string
				@Var.Dir() CWD = '.'
			}
			expect({ ...E.load({ CERT: ' cert.pem ' }) }).toEqual({
				SHARED_DIR: join(root, 'temp'),
				CERT: join(root, 'cert.pem'),
				CWD: process.cwd(),
			})
			// Absolute paths are kept as is.
			expect(E.load({ CERT: join(root, 'cert.pem'), SHARED_DIR: root }).SHARED_DIR).toBe(root)

			const errors = (source: Record<string, string>) => {
				try {
					E.load(source)
				} catch (err: any) {
					return err.errors.map((e: any) => e.message)
				}
				return []
			}
			expect(errors({ CERT: 'temp', SHARED_DIR: 'cert.pem', CWD: '~/data' })).toEqual([
				`"SHARED_DIR" must be a directory (relative to ${root}) (got "cert.pem")`,
				`"CERT" must be a file (relative to ${root}) (got "temp")`,
				'"CWD" must be an absolute or relative path, without ~ (got "~/data")',
			])
			expect(errors({ CERT: 'nope' })).toEqual([
				`"CERT" must be an existing file (relative to ${root}) (got "nope")`,
			])

			// Defaults are validated as well.
			class Missing extends Environment {
				@Var.Dir({ base: root }) DIR = 'nope'
			}
			expect(() => Missing.load({})).toThrow(
				`invalid default value: "DIR" must be an existing directory (relative to ${root}) (got "nope")`
			)

			// Mocked, since root bypasses permissions.
			const denied = jest.spyOn(fs, 'accessSync').mockImplementation(() => {
				throw new Error('EACCES')
			})
			expect(errors({ CERT: 'cert.pem' })).toEqual([
				`invalid default value: "SHARED_DIR" must be a writable directory (relative to ${root}) (got "temp")`,
				`"CERT" must be a readable file (relative to ${root}) (got "cert.pem")`,
			])
			denied.mockRestore()

			expect(Var.Dir.parse(root, 'D')).toBe(root)
			expect(() => Var.File.parse(root, 'F')).toThrow('"F" must be a file')

			// The path holds the value, so it is left out of messages of sensitive variables.
			class S extends Environment {
				@Sensitive() @Var.File() TOKEN!: string
			}
			expect(() => S.load({ TOKEN: 'super-secret-token' })).toThrow(
				/^Invalid environment variables:\n - TOKEN \(invalid\): "TOKEN" must be an existing file \(relative to the current directory\)$/
			)

			// Other errors than missing files.
			const statDenied = jest.spyOn(fs, 'statSync').mockImplementation(() => {
				throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
			})
			expect(() => Var.Dir.parse(root, 'D')).toThrow('"D" cannot be accessed (EACCES)')
			statDenied.mockRestore()
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('Var.Url restricts protocols', () => {
		class E extends Environment {
			@Var.Url({ protocols: ['mongodb', 'mongodb+srv'] }) MONGO_URL!: string
			@Var.Url({ protocols: ['HTTPS:'] }) API = 'https://example.com'
		}
		expect(E.load({ MONGO_URL: 'mongodb+srv://user:pass@cluster/app' }).MONGO_URL).toBe(
			'mongodb+srv://user:pass@cluster/app'
		)
		// Credentials of sensitive URLs are left out of messages.
		@Sensitive()
		class S extends E {}
		expect(() => S.load({ MONGO_URL: 'redis://user:pass@cache' })).toThrow(
			/^Invalid environment variables:\n - MONGO_URL \(invalid\): "MONGO_URL" must be a URL with protocol mongodb or mongodb\+srv$/
		)
		expect(() => E.load({ MONGO_URL: 'mongodb://db', API: 'http://example.com' })).toThrow(
			'"API" must be a URL with protocol https (got "http://example.com")'
		)

		class D extends Environment {
			@Var.Url({ protocols: ['https'] }) API = 'http://example.com'
		}
		expect(() => D.load({})).toThrow('invalid default value: "API" must be a URL with protocol https')
		expect(Var.Url.parse(' ftp://x ', 'U')).toBe('ftp://x')
	})

	test('Var.Duration and Var.Size convert units', () => {
		class E extends Environment {
			@Var.Duration({ min: '1s', max: '1h' }) TIMEOUT = 30_000
			@Var.Duration({ optional: true }) TTL?: number
			@Var.Size({ max: '1GB' }) UPLOAD_LIMIT = 10_000_000
			@Var.Size({ min: 1024, optional: true }) CHUNK?: number
		}
		expect({ ...E.load({}) }).toEqual({ TIMEOUT: 30_000, UPLOAD_LIMIT: 10_000_000 })
		expect({ ...E.load({ TIMEOUT: '1m30s', TTL: '1.5d', UPLOAD_LIMIT: ' 50 MB ', CHUNK: '1KiB' }) }).toEqual({
			TIMEOUT: 90_000,
			TTL: 129_600_000,
			UPLOAD_LIMIT: 50_000_000,
			CHUNK: 1024,
		})
		expect(E.load({ TIMEOUT: '1.1s', UPLOAD_LIMIT: '1.1kb', CHUNK: '2048' })).toMatchObject({
			TIMEOUT: 1100,
			UPLOAD_LIMIT: 1100,
			CHUNK: 2048,
		})

		try {
			E.load({ TIMEOUT: '30', TTL: '2h', UPLOAD_LIMIT: '2GB', CHUNK: '0.1KiB' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual([
				'"TIMEOUT" must be a duration with units (ms, s, m, h, d), e.g. 30s or 1h30m (got "30")',
				'"UPLOAD_LIMIT" must be at most 1GB (got "2GB")',
				'"CHUNK" must be a whole number of bytes (got "0.1KiB")',
			])
		}
		expect(() => E.load({ TIMEOUT: '500ms', CHUNK: '1000' })).toThrow(
			/TIMEOUT \(invalid\): "TIMEOUT" must be at least 1s[^]*CHUNK \(invalid\): "CHUNK" must be at least 1024/
		)

		// Defaults are in the base unit, and validated.
		class D extends Environment {
			@Var.Duration({ max: '1h' }) TIMEOUT = 2 * 3_600_000
			@Var.Size() NEGATIVE = -1
		}
		expect(() => D.load({})).toThrow(/"TIMEOUT" must be at most 1h[^]*"NEGATIVE" must be a size, positive or zero/)

		// 0 without unit, case sensitive duration units, each unit once, safe sizes, consistent bounds.
		expect(Var.Duration.parse('0', 'D')).toBe(0)
		for (const raw of ['1M', '1h1h', '10']) expect(() => Var.Duration.parse(raw, 'D')).toThrow('must be a duration')
		expect(() => Var.Size.parse('99999999TB', 'S')).toThrow(`"S" must be at most ${Number.MAX_SAFE_INTEGER}`)
		expect(() => Var.Duration({ min: '1h', max: '1s' })).toThrow('@Var.Duration min cannot exceed max.')
		expect(() => Var.Size({ min: -5 })).toThrow('@Var.Size min must be a size with units')
		expect(() => Var.Duration({ max: '1 hour' })).toThrow('@Var.Duration max must be a duration with units')
		expect(Var.Size.parse('1.5GiB', 'S')).toBe(1.5 * 1024 ** 3)
	})

	test('bytes are out of the shared pool of small buffers, and base64url is strict', () => {
		// Bytes out of the shared pool of small buffers.
		class B extends Environment {
			@Var.Bytes() K!: Buffer
			@Var.Bytes({ encoding: 'base64url' }) U?: Buffer = Buffer.alloc(0)
		}
		const { K } = B.load({ K: 'abcd' })
		expect(K.toString()).toBe('abcd')
		expect(K.buffer.byteLength).toBe(4)
		// Strict base64url, padding allowed.
		expect(() => B.load({ K: 'k', U: 'A' })).toThrow('"U" must be valid base64url')
		expect(() => B.load({ K: 'k', U: 'AAAAA' })).toThrow('"U" must be valid base64url')
		expect(B.load({ K: 'k', U: 'AAE=' }).U).toEqual(Buffer.from([0, 1]))
		expect(B.load({ K: 'k', U: 'AAE' }).U).toEqual(Buffer.from([0, 1]))
	})

	test('list defaults of JSON items are copied, and separators only are missing', () => {
		// List defaults of JSON items are copied before freezing.
		const item = { a: 1 }
		class L extends Environment {
			@Var.List(Var.Json) ITEMS: unknown[] = [item]
			@Var.List(Var.Port) PORTS!: number[]
			@Var.List(Var.Port, { allowEmpty: true }) EMPTY?: number[]
		}
		const env = L.load({ PORTS: '80', EMPTY: ',' })
		expect(env.ITEMS).toEqual([{ a: 1 }])
		expect(Object.isFrozen(env.ITEMS[0])).toBe(true)
		expect(Object.isFrozen(item)).toBe(false)
		expect(env.EMPTY).toEqual([])
		// A list of separators only is missing.
		expect(() => L.load({ PORTS: ' , ,' })).toThrow(/PORTS \(missing\)/)
		expect(() => Var.List(Var.Str, { separator: '' })).toThrow('@Var.List separator cannot be empty.')
	})

	test('JSON values have no choices', () => {
		// Json values can't be compared to choices.
		// @ts-expect-error no choices
		expect(() => Var.Json({ choices: [{ a: 1 }] })).toBeDefined()
	})

	test('URL protocols must be URL schemes', () => {
		// Protocols must be URL schemes.
		for (const protocols of [[], ['https://'], ['mailto x']]) {
			expect(() => Var.Url({ protocols })).toThrow('@Var.Url protocols must be URL schemes')
		}
	})

	test('JSON numbers must be finite, and defaults serializable', () => {
		// JSON numbers must be finite, and defaults serializable.
		class J extends Environment {
			@Var.Json() J!: unknown
		}
		expect(() => J.load({ J: '[1e400]' })).toThrow('"J" must be valid JSON, with finite numbers')
		class F extends Environment {
			@Var.Json() J = () => 1
		}
		expect(() => F.load({})).toThrow(/invalid default value: "J" must be serializable to JSON$/m)
	})

	test('an empty path default is invalid', () => {
		// An empty path default is invalid, as an empty environment value.
		class D extends Environment {
			@Var.Dir() D = ''
		}
		expect(() => D.load({})).toThrow('invalid default value: "D" must be a path, not empty')
	})

	test('decimal sizes and durations are exact, also as limits', () => {
		// Exact decimal sizes, also as limits.
		class S extends Environment {
			@Var.Size({ max: '8.2GB' }) SIZE = 8_200_000_000
		}
		expect(S.load({}).SIZE).toBe(8_200_000_000)
		expect(S.load({ SIZE: '8.2GB' }).SIZE).toBe(8_200_000_000)
		for (const raw of ['16.4GB', '4.07GB', '33.694GB', '1.1KB'])
			expect(Number.isInteger(Var.Size.parse(raw, 'S'))).toBe(true)
		expect(Var.Duration.parse('1.1s', 'D')).toBe(1100)
		expect(() => Var.Duration.parse('1constructor', 'D')).toThrow('must be a duration with units')
	})

	test('JSON null is a value', () => {
		// JSON null is a value.
		class J extends Environment {
			@Var.Json<{ a: number } | null>() C!: { a: number } | null
		}
		expect(J.load({ C: 'null' }).C).toBeNull()
	})

	test('sizes are exact whatever the decimals, and units can be combined', () => {
		// Exact sizes, whatever the decimals, and combined units.
		expect(Var.Size.parse('7.122678129GB', 'S')).toBe(7_122_678_129)
		expect(Var.Size.parse('1.000000000000000000000KB', 'S')).toBe(1000)
		expect(Var.Size.parse('1GB500MB', 'S')).toBe(1_500_000_000)
		expect(() => Var.Size.parse('1KB1KB', 'S')).toThrow('must be a size with units')
		expect(Var.Duration.parse('0.5ms', 'D')).toBe(0.5)
	})
})
