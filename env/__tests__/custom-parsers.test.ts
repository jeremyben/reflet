import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Var, Environment, Parser } from '../src'

describe('Custom parsers', () => {
	test('a function coerces the raw value', () => {
		class E extends Environment {
			@Var.Custom((raw) => raw.split(',')) LIST!: string[]
		}
		expect(E.load({ LIST: 'a,b,c' }).LIST).toEqual(['a', 'b', 'c'])
	})

	test('coerce and validate steps of custom variables', () => {
		const root = mkdtempSync(join(tmpdir(), 'reflet-env-root-'))
		try {
			mkdirSync(join(root, 'temp'))
			const folder = (value: string, name: string) => {
				const path = join(root, value)
				if (!existsSync(path)) throw new Error(`"${name}" folder "${path}" does not exist`)
				return path
			}

			class E extends Environment {
				// Validated defaults, as environment values.
				@Var.Custom({ validate: folder }) SHARED_DIR = 'temp'
				// A function only coerces environment values, so defaults are not validated.
				@Var.Custom(folder) RAW_DIR = 'not-validated'
				@Var.Custom({ coerce: (raw) => Number(raw), validate: (n, name) => (n > 0 ? n : fail(name)) }) N = 1
			}
			const fail = (name: string): never => {
				throw new Error(`"${name}" must be positive`)
			}
			expect({ ...E.load({}) }).toEqual({ SHARED_DIR: join(root, 'temp'), RAW_DIR: 'not-validated', N: 1 })
			expect(E.load({ SHARED_DIR: '.', N: '2' })).toMatchObject({ SHARED_DIR: join(root, '.'), N: 2 })
			expect(() => E.load({ N: '-1' })).toThrow('"N" must be positive (got "-1")')

			class Missing extends Environment {
				@Var.Custom({ validate: folder }) SHARED_DIR = 'nope'
				@Var.Custom({ coerce: Number, validate: (n, name) => (n > 0 ? n : fail(name)) }) N = 0
			}
			expect(() => Missing.load({})).toThrow(
				/SHARED_DIR \(invalid\): invalid default value: "SHARED_DIR" folder ".*nope" does not exist[^]*N \(invalid\): invalid default value: "N" must be positive \(got 0\)/
			)

			// @ts-expect-error without coerce, the value is a string
			expect(() => Var.Custom({ validate: (n: number) => n })).toBeDefined()
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('parsers are reusable, in variables and lists', () => {
		const upper: Parser<string> = { coerce: (raw) => raw.toUpperCase() }
		const lower: Parser<string> = { validate: (value) => value.toLowerCase() }
		const csv = (raw: string) => raw.split(';')
		const date: Parser<Date> = {
			coerce: (raw) => new Date(raw),
			validate: (value, name) => {
				if (Number.isNaN(value.getTime())) throw new Error(`"${name}" must be a date`)
				return value
			},
		}

		class E extends Environment {
			@Var.Custom(upper) A!: string
			@Var.Custom(upper) B = 'b'
			@Var.Custom(lower) G = 'G'
			@Var.List(lower) H = ['X', 'Y']
			@Var.Custom(upper, { optional: true }) C?: string
			@Var.List(upper) D: string[] = []
			@Var.Custom(csv) E!: string[]
			@Var.Custom(date) LAUNCH = new Date('2030-01-01T00:00:00Z')
			@Var.List(date) HOLIDAYS: Date[] = []
			@Var.List((raw) => Number(raw)) N: number[] = []
			@Var.List({ validate: (value: string) => value.trim() }) T: string[] = []
		}
		const env = E.load({ A: 'a', D: 'x,y', E: '1;2', HOLIDAYS: '2030-12-25', N: '1,2' })
		expect({ ...env, LAUNCH: undefined, HOLIDAYS: undefined }).toEqual({
			A: 'A',
			B: 'b',
			G: 'g',
			H: ['x', 'y'],
			D: ['X', 'Y'],
			E: ['1', '2'],
			N: [1, 2],
			T: [],
		})
		expect(env.HOLIDAYS[0].toISOString()).toBe('2030-12-25T00:00:00.000Z')
		expect(E.load({ A: 'a', C: 'c', E: '1' }).C).toBe('C')
		// List items of custom types are coerced and validated, defaults included.
		expect(() => E.load({ A: 'a', E: '1', HOLIDAYS: '2030-12-25,nope' })).toThrow('"HOLIDAYS[1]" must be a date')
		class D extends E {
			@Var.List(date) HOLIDAYS: Date[] = [new Date('nope')]
		}
		expect(() => D.load({ A: 'a', E: '1' })).toThrow('invalid default value: "HOLIDAYS[0]" must be a date')

		class Invalid {
			// @ts-expect-error parsed string is not a number
			@Var.Custom(upper) A!: number
			// @ts-expect-error a date is not a string
			@Var.List(date) B!: string[]
		}
		// @ts-expect-error a coerce step is needed for another type than string
		const invalid: Parser<Date> = { validate: (value: Date) => value }
		// The steps of a parser.
		const toDate: Parser.Coercer<Date> = (raw) => new Date(raw)
		const validDate: Parser.Validator<Date> = (value) => value
		const steps: Parser<Date> = { coerce: toDate, validate: validDate }
		const semicolons: Parser<string[]> = (raw) => raw.split(';')
		expect([steps, semicolons]).toBeDefined()
		expect([Invalid, invalid]).toBeDefined()
	})

	test('parsers must return a value', () => {
		// Parsers must return a value.
		class C extends Environment {
			@Var.Custom((raw) => (raw === 'none' ? (undefined as any) : raw)) C!: string
			@Var.Str({ validate: () => undefined as any, optional: true }) N?: string
		}
		expect(() => C.load({ C: 'none', N: 'n' })).toThrow(
			/"C" parser must return a value \(got "none"\)[^]*"N" validate option must return a value/
		)
	})
})
