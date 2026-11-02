import { Var, Environment, EnvValidationError, CrossCheck } from '../src'

describe('Cross checks', () => {
	test('cross checks report errors on variables', () => {
		const calls: string[] = []

		@CrossCheck((env: Base, fail) => {
			calls.push('base')
			if (env.isProduction && env.KEY === 'fake') fail('KEY', 'cannot be fake in production')
		})
		class Base extends Environment {
			@Var.Str({ choices: ['development', 'production'] }) NODE_ENV!: 'development' | 'production'
			@Var.Str({ name: ['STRIPE_KEY', 'OLD_KEY'], desc: 'Stripe key' }) KEY = 'fake'

			get isProduction() {
				return this.NODE_ENV === 'production'
			}
		}

		@CrossCheck((env: Env, fail) => {
			calls.push('first')
			if (env.PORT === 1) fail('PORT', 'cannot be 1')
			if (env.PORT === 2) fail('isProduction', 'not a variable')
		})
		@CrossCheck((env: Env) => {
			calls.push('second')
			if (env.PORT === 1) (env as any).PORT = 0
		})
		class Env extends Base {
			@Var.Port() PORT = 3000
		}

		expect(Env.load({ NODE_ENV: 'development' }).KEY).toBe('fake')
		// Parents' first, then in declaration order.
		expect(calls).toEqual(['base', 'first', 'second'])

		try {
			Env.load({ NODE_ENV: 'production', OLD_KEY: 'fake', PORT: '1' })
			fail('should throw')
		} catch (err: any) {
			expect(err).toBeInstanceOf(EnvValidationError)
			expect(err.errors).toEqual([
				{ name: 'OLD_KEY', kind: 'invalid', message: 'cannot be fake in production', desc: 'Stripe key' },
				{ name: 'PORT', kind: 'invalid', message: 'cannot be 1' },
				// The environment is frozen.
				{ name: 'Env', kind: 'invalid', message: expect.stringMatching(/^cross check failed: Cannot assign/) },
			])
		}

		expect(() => Env.load({ NODE_ENV: 'development', PORT: '2' })).toThrow(
			' - isProduction (invalid): not a variable'
		)

		// Not run until all variables are valid.
		calls.length = 0
		expect(() => Env.load({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV \(invalid\)/)
		expect(calls).toEqual([])

		// @ts-expect-error another class
		@CrossCheck((env: Base) => env)
		class Other extends Environment {}
		// @ts-expect-error unknown key
		CrossCheck((env: Base, fail) => fail('UNKNOWN', 'x'))
		expect(Other).toBeDefined()
	})

	test('getters and methods using #private fields work in cross checks', () => {
		@CrossCheck((env: E, fail) => {
			if (env.isEurope && !env.GDPR) fail('GDPR', 'required in Europe')
		})
		class E extends Environment {
			#region = 'eu'
			@Var.Str() A: string = 'x'
			@Var.Str({ optional: true }) GDPR?: string

			get isEurope() {
				return this.#region === 'eu'
			}

			label() {
				return `${this.A}-${this.#region}`
			}
		}

		expect(() => E.load({})).toThrow('GDPR (invalid): required in Europe')
		const env = E.load({ GDPR: 'dpo@a.co' })
		expect(env.label()).toBe('x-eu')
		expect(Object.keys(env)).toEqual(['A', 'GDPR'])
	})

	test('async cross checks are rejected', async () => {
		// Async cross checks are rejected, since they would fail too late.
		@CrossCheck(async (env: A, fail) => {
			await null
			fail('PORT', 'too late')
		})
		class A extends Environment {
			@Var.Port() PORT = 3000
		}
		expect(() => A.load({})).toThrow(' - A (invalid): cross check failed: must be synchronous')
		// Its rejection is not left unhandled.
		@CrossCheck(async () => {
			throw new Error('rejected')
		})
		class R extends Environment {}
		expect(() => R.load({})).toThrow('cross check failed: must be synchronous')
		await new Promise((resolve) => setImmediate(resolve))
		// @ts-expect-error methods are not variables
		CrossCheck((env: A, fail) => fail('toJSON', 'x'))
	})

	test('late fail calls of an async cross check are ignored', async () => {
		// A late fail of an async cross check is ignored.
		@CrossCheck(async (env: A, fail) => {
			await null
			fail('PORT', 'too late')
		})
		class A extends Environment {
			@Var.Port() PORT = 3000
		}
		let error: any
		try {
			A.load({})
		} catch (err) {
			error = err
		}
		await new Promise((resolve) => setImmediate(resolve))
		expect(error.errors).toHaveLength(1)
	})
})
