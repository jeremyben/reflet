import { inspect } from 'util'
import { Var, Environment, EnvValidationError, Sensitive, Secrets, UnsetSensitive } from '../src'

describe('Sensitive values', () => {
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

	test('Sensitive on a class or a property', () => {
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

	test('UnsetSensitive removes sensitive variables from process.env', () => {
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

	test('reveal shows the last characters', () => {
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
			/"KEY" must be one of \[sk_live_abcdef123\] \(got "\*\*\*999"\)\n - HIDDEN \(invalid\): "HIDDEN" must be one of \[a\]$/
		)

		expect(() => Sensitive({ reveal: 0 })).toThrow('@Sensitive "reveal" option must be a positive integer.')
		expect(() => Sensitive({ reveal: 1.5 })).toThrow('@Sensitive "reveal" option must be a positive integer.')
	})

	test('an unset optional sensitive variable is not masked', () => {
		// An unset optional sensitive variable does not look set.
		class O extends Environment {
			// Defined as undefined, as with `useDefineForClassFields`.
			@Sensitive() @Var.Str({ optional: true }) TOKEN?: string = undefined
			@Sensitive() @Var.Str() SET = 'secret'
		}
		const optional = O.load({})
		expect(optional.toJSON()).toEqual({ TOKEN: undefined, SET: '***' })
		expect(inspect(optional)).toBe("O { TOKEN: undefined, SET: '***' }")
	})

	test('URL credentials are masked in error messages, even if not sensitive', () => {
		// URL credentials are masked in messages, even if not sensitive.
		class U extends Environment {
			@Var.Url({ protocols: ['https'] }) U!: string
		}
		expect(() => U.load({ U: 'http://user:pass@example.com/path' })).toThrow(
			'"U" must be a URL with protocol https (got "http://***@example.com/path")'
		)
		// Up to the last @, on the safe side (passwords may hold @ or /), in any value, lists included.
		expect(() => U.load({ U: 'http://example.com/a:b@c' })).toThrow('(got "http://***@c")')
		expect(() => U.load({ U: 'postgres://user:p@ss/word@host/db' })).toThrow('(got "postgres://***@host/db")')
		expect(() => U.load({ U: 'http://ghp_token@github.com/x' })).toThrow('(got "http://***@github.com/x")')
		class L extends Environment {
			@Var.List(Var.Url) URLS!: string[]
			@Var.Str({ pattern: /^x/ }) DSN!: string
		}
		expect(() => L.load({ URLS: 'https://u:p@a.com, nope', DSN: 'redis://:secret@cache' })).toThrow(
			/\(got "https:\/\/\*\*\*@a\.com, nope"\)[^]*\(got "redis:\/\/\*\*\*@cache"\)/
		)
	})

	test('NODE_ENV is never sensitive', () => {
		// NODE_ENV is left out of a sensitive class, so it is neither masked nor unset.
		const nodeEnv = process.env.NODE_ENV
		@UnsetSensitive()
		@Sensitive()
		class S extends Environment {
			@Var.Str() NODE_ENV!: string
			@Var.Str() TOKEN!: string
		}
		process.env.TOKEN = 'secret'
		expect(inspect(S.load())).toBe(`S { NODE_ENV: '${nodeEnv}', TOKEN: '***' }`)
		expect([process.env.NODE_ENV, process.env.TOKEN]).toEqual([nodeEnv, undefined])
		class P extends Environment {
			@Sensitive() @Var.Str({ name: 'NODE_ENV' }) MODE!: string
		}
		expect(() => P.load({ NODE_ENV: 'test' })).toThrow(
			'"P.MODE" cannot be sensitive, as NODE_ENV is read by libraries.'
		)
	})

	test('URL credentials with spaces, commas, semicolons or quotes are masked', () => {
		// Credentials with spaces, commas, semicolons or quotes are masked as well.
		class U extends Environment {
			@Var.Url({ protocols: ['https'] }) U!: string
		}
		for (const password of ['p,ss', 'p;ss', "p'ss", 'p"ss', 'p ss']) {
			expect(() => U.load({ U: `postgres://user:${password}@db/app` })).toThrow('(got "postgres://***@db/app")')
		}
		class J extends Environment {
			@Var.Json({ validate: () => fail('x') }) J = { db: 'postgres://u:p,w@h/x' }
		}
		expect(() => J.load({})).toThrow('(got {"db":"postgres://***@h/x"})')
	})

	test('URL credentials are masked with a mistyped scheme separator', () => {
		// Credentials are masked with a mistyped scheme separator, when the URL is invalid.
		class U extends Environment {
			@Var.Url() U!: string
		}
		for (const [raw, shown] of [
			['https:/user:s3cret@db.example.com', 'https:/***@db.example.com'],
			['https:\\user:s3cret@db', 'https:\\\\***@db'],
			['https:user:s3cret@db', 'https:***@db'],
			['postgres//user:s3cret@db/app', 'postgres//***@db/app'],
		]) {
			expect(() => U.load({ U: raw })).toThrow(`(got "${shown}")`)
		}
		// Linear, even for a huge invalid value.
		class P extends Environment {
			@Var.Port() P!: number
		}
		const start = Date.now()
		expect(() => P.load({ P: 'a://'.repeat(30_000) })).toThrow('"P" must be a finite decimal number')
		expect(Date.now() - start).toBeLessThan(1000)
	})

	test('symbol keys are shown, and masked', () => {
		// Symbol keys are shown as well.
		const token = Symbol('token')
		class S extends Environment {
			@Sensitive() @Var.Str({ name: 'TOKEN' }) [token]!: string
			@Var.Port() PORT = 3000
		}
		expect(inspect(S.load({ TOKEN: 'secret' }))).toBe("S { PORT: 3000, [Symbol(token)]: '***' }")
	})
})
