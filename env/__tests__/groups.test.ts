import { Var, Environment, Group } from '../src'

describe('Groups', () => {
	test('presence rules of groups', () => {
		@Group.AllOrNone('S3_ACCESS_KEY', 'S3_SECRET_KEY')
		@Group.OneOf('MONGO_URL', 'MONGO_HOST')
		@Group.AnyOf('SMTP_URL', 'MAIL_API_KEY')
		@Group.RequiredWhen('SENTRY_ENABLED', ['SENTRY_DSN', 'SENTRY_ENV'])
		class E extends Environment {
			@Var.Str({ optional: true }) S3_ACCESS_KEY?: string
			@Var.Str({ optional: true, name: 'S3_SECRET', desc: 'S3 secret' }) S3_SECRET_KEY?: string
			@Var.Url({ optional: true }) MONGO_URL?: string
			@Var.Host({ optional: true }) MONGO_HOST?: string
			@Var.Url({ optional: true }) SMTP_URL?: string
			@Var.Str({ optional: true }) MAIL_API_KEY?: string
			@Var.Bool() SENTRY_ENABLED = false
			@Var.Url({ optional: true }) SENTRY_DSN?: string
			@Var.Str({ optional: true }) SENTRY_ENV?: string
		}
		const valid = { MONGO_HOST: 'db', MAIL_API_KEY: 'k' }
		expect({ ...E.load(valid) }).toEqual({ ...valid, SENTRY_ENABLED: false })
		expect(E.load({ ...valid, S3_ACCESS_KEY: 'a', S3_SECRET: 's', SMTP_URL: 'smtp://x' })).toMatchObject({
			S3_SECRET_KEY: 's',
		})
		expect(
			E.load({ ...valid, SENTRY_ENABLED: 'true', SENTRY_DSN: 'https://sentry.io', SENTRY_ENV: 'p' }).SENTRY_DSN
		).toBe('https://sentry.io')

		const errors = (source: Record<string, string>) => {
			try {
				E.load(source)
			} catch (err: any) {
				return err.errors.map(({ name, kind, message, desc }: any) => ({ name, kind, message, desc }))
			}
			return []
		}
		expect(errors({ S3_ACCESS_KEY: 'a', SENTRY_ENABLED: 'true' })).toEqual([
			{ name: 'S3_SECRET', kind: 'missing', message: 'required together with S3_ACCESS_KEY', desc: 'S3 secret' },
			{ name: 'MONGO_URL', kind: 'missing', message: 'one of MONGO_URL, MONGO_HOST is required' },
			{ name: 'SMTP_URL', kind: 'missing', message: 'at least one of SMTP_URL, MAIL_API_KEY is required' },
			{ name: 'SENTRY_DSN', kind: 'missing', message: 'required when SENTRY_ENABLED' },
			{ name: 'SENTRY_ENV', kind: 'missing', message: 'required when SENTRY_ENABLED' },
		])
		expect(errors({ ...valid, MONGO_URL: 'mongodb://db' })).toEqual([
			{ name: 'MONGO_HOST', kind: 'invalid', message: 'only one of MONGO_URL, MONGO_HOST can be set' },
		])
		// Not checked with an invalid variable of the group.
		expect(errors({ MAIL_API_KEY: 'k', MONGO_URL: 'nope' })).toEqual([
			expect.objectContaining({ name: 'MONGO_URL', message: '"MONGO_URL" must be a valid URL (got "nope")' }),
		])

		// Inherited.
		class Sub extends E {}
		expect(() => Sub.load({})).toThrow(/MONGO_URL \(missing\)/)

		// Variables of groups must be optional, without default, by types and at runtime.
		// @ts-expect-error A must be optional
		@Group.AllOrNone('A', 'B')
		class Required extends Environment {
			@Var.Str() A!: string
			@Var.Str({ optional: true }) B?: string
		}
		expect(() => Required.load({})).toThrow('"Required.A" is in @Group.AllOrNone, so it must be optional.')
		@Group.OneOf('A', 'B')
		class Defaulted extends Environment {
			@Var.Str({ optional: true }) A?: string = 'a'
			@Var.Str({ optional: true }) B?: string
		}
		expect(() => Defaulted.load({ B: 'b' })).toThrow(
			'"Defaulted.A" is in @Group.OneOf, so it cannot have a default value.'
		)
		@Group.OneOf('A', 'B')
		class Undecorated extends Environment {
			@Var.Str({ optional: true }) A?: string
			B?: string
		}
		expect(() => Undecorated.load({})).toThrow('"Undecorated.B" is in @Group.OneOf, but has no variable decorator.')
		expect(() => Group.AnyOf('A')).toThrow('@Group.AnyOf needs at least 2 different properties.')
		expect(() => Group.OneOf('A', 'A')).toThrow('@Group.OneOf needs at least 2 different properties.')
		expect(() => Group.RequiredWhen('A', [])).toThrow('@Group.RequiredWhen needs at least 1 different properties.')
		expect(() => Group.RequiredWhen('A', ['A', 'B'])).toThrow('@Group.RequiredWhen flag cannot be in its group.')

		// @ts-expect-error unknown property
		@Group.AllOrNone('A', 'TYPO')
		class Typo extends Environment {
			@Var.Str({ optional: true }) A?: string
		}
		expect(Typo).toBeDefined()
	})

	test('the RequiredWhen flag is a boolean variable, and group properties are optional', () => {
		// The flag of RequiredWhen is a boolean variable.
		// @ts-expect-error not a boolean
		@Group.RequiredWhen('MODE', ['DSN'])
		class F extends Environment {
			@Var.Str() MODE = 'on'
			@Var.Url({ optional: true }) DSN?: string
		}
		expect(() => F.load({})).toThrow('"F.MODE" is in @Group.RequiredWhen, so it must be a Var.Bool flag.')
		// @ts-expect-error a getter is not optional
		@Group.AnyOf('isProd', 'DSN')
		class G extends Environment {
			@Var.Url({ optional: true }) DSN?: string
			get isProd() {
				return false
			}
		}
		expect(G).toBeDefined()
	})
})
