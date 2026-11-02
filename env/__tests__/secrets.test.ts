import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { inspect } from 'util'
import { Var, Environment, Sensitive, Secrets } from '../src'

describe('Secret files', () => {
	// Applies the decorator to a subclass, since directories are created at runtime.
	const withSecrets = <T extends Function & { prototype: Environment }>(cls: T, ...dirs: (string | undefined)[]) => {
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

		// The closest class wins, over property directories of a parent.
		class PropertyParent extends Environment {
			@Secrets(credentials) @Var.Str() DB_PASSWORD!: string
		}
		@Secrets([])
		class PropertyTestEnv extends PropertyParent {}
		expect(PropertyParent.load({}).DB_PASSWORD).toBe('s3cr3t')
		expect(() => PropertyTestEnv.load({})).toThrow(/DB_PASSWORD \(missing\)/)

		@Sensitive()
		class Masked extends PropertyParent {}
		class Revealed extends Masked {
			@Sensitive({ reveal: 2 }) @Var.Str() DB_PASSWORD!: string
		}
		expect(inspect(Masked.load({ DB_PASSWORD: 'abcdefgh' }))).toBe("Masked { DB_PASSWORD: '***' }")
		expect(inspect(Revealed.load({ DB_PASSWORD: 'abcdefgh' }))).toBe("Revealed { DB_PASSWORD: '***gh' }")

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
