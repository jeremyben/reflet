import { Var, Environment, Sensitive } from '../src'

describe('Decorator definitions', () => {
	test('decorators check property types', () => {
		const s = Symbol('s')

		// Compiles: valid declarations.
		class Valid extends Environment {
			@Var.Str() A!: string
			@Var.Str() B: string = 'production'
			@Var.Str({ choices: ['a', 'b'] }) C!: 'a' | 'b'
			@Var.Str({ choices: ['a', 'b'] }) D!: string
			@Var.Str({ optional: true }) E?: string
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

	test('standard decorators are reported', () => {
		// Arguments of a standard field decorator, when "experimentalDecorators" is not enabled.
		const standard = Var.Str() as unknown as (value: undefined, context: object) => void
		expect(() => standard(undefined, { kind: 'field', name: 'A' })).toThrow(
			'@reflet/env decorators require the "experimentalDecorators" TypeScript option.'
		)
		const sensitive = Sensitive() as unknown as (value: undefined, context: object) => void
		expect(() => sensitive(undefined, { kind: 'field', name: 'A' })).toThrow('"experimentalDecorators"')
	})

	test('explicit type arguments', () => {
		class E extends Environment {
			@Var.Bool() F = false
			@Var.Str<'x' | 'y'>({ choices: ['x', 'y'] }) S: 'x' | 'y' = 'x'
			@Var.Json<{ retries: number }>({ optional: true }) J?: { retries: number }
			@Var.Custom<Date>((raw) => new Date(raw), { optional: true }) D?: Date
			@Var.List<number>(Var.Port, { optional: true }) L?: number[]
		}
		expect(E.load({})).toEqual({ F: false, S: 'x' })
		expect(E.load({ J: '{"retries":1}', L: '80' })).toMatchObject({ J: { retries: 1 }, L: [80] })

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
})
