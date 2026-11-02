import { Var, Environment, EnvValidationError } from '../src'

describe('Environment', () => {
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

	test('NODE_ENV flags can be defined as getters', () => {
		class E extends Environment {
			@Var.Str({ choices: ['development', 'production', 'test'] }) NODE_ENV!:
				| 'development'
				| 'production'
				| 'test'

			get isProduction() {
				return this.NODE_ENV === 'production'
			}
		}

		expect(E.load({ NODE_ENV: 'development' }).isProduction).toBe(false)
		expect(E.load({ NODE_ENV: 'production' }).isProduction).toBe(true)
		expect(Object.keys(E.load({ NODE_ENV: 'test' }))).toEqual(['NODE_ENV'])
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
		expect(() => Child.load({ A: 'a', B: 'b', N: '1' })).toThrow(/N \(invalid\): "N" must be one of \[2, 3\]/)

		const base = Base.load({ A: 'a', N: '5' })
		expect(base).toEqual({ A: 'a', N: 5 })
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

	test('source prototype keys are ignored', () => {
		class E extends Environment {
			@Var.Str({ name: 'toString' }) X?: string
		}
		expect(() => E.load({})).toThrow(/toString \(missing\)/)
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

	test('EnvValidationError exposes kind and metadata', () => {
		class E extends Environment {
			@Var.Num({ desc: 'Item count', docs: 'https://docs/COUNT' }) COUNT!: number
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
				docs: 'https://docs/COUNT',
			})
			expect(err.message).toContain('Item count')
			expect(err.message).toContain('https://docs/COUNT')
			expect(err.message).toContain('API_KEY (missing)')
		}
	})

	test('non-Error throws are reported', () => {
		class E extends Environment {
			@Var.Custom((): string => {
				throw 'nope'
			})
			A!: string
		}

		try {
			E.load({ A: 'a' })
			fail('should throw')
		} catch (err: any) {
			expect(err.errors.map((e: any) => e.message)).toEqual(['nope (got "a")'])
		}
	})
})
