import {
	bool,
	bytes,
	custom,
	duration,
	email,
	host,
	json,
	list,
	num,
	parseWith,
	path,
	port,
	size,
	str,
	urlWith,
	withValidation,
} from './parsers'
import { ancestry, checkExperimentalDecorators } from './utils'
import type { ClassType, Parser, Spec, TypeSteps } from './interfaces'

/** Own specs of each class, in declaration order. */
const definitions = new WeakMap<object, Map<string | symbol, Spec<any>>>()

/** Steps of the parsers exposed by variable types, e.g. to validate the defaults of list items. */
const STEPS = new WeakMap<Parser.Coercer<any>, TypeSteps<any>>()

/**
 * Fails on definitions that would otherwise be silently ignored or overridden.
 * Redefining a parent property in a subclass is fine.
 */
function define(target: object, propertyKey: string | symbol, spec: Spec<any>): void {
	checkExperimentalDecorators(target, propertyKey)

	const fail = (reason: string) => {
		const className = typeof target === 'function' ? target.name : target.constructor.name
		throw new Error(`"${className}.${String(propertyKey)}" ${reason}.`)
	}

	if (typeof target === 'function') fail('cannot be static')
	if (Object.getOwnPropertyDescriptor(target, propertyKey)) fail('must be a property, not a method or accessor')

	if (Array.isArray(spec.name) && !spec.name.length) fail('needs at least one name')
	if (typeof propertyKey === 'symbol' && !spec.name) fail('needs a `name` option, as a symbol property')

	const own = definitions.get(target.constructor) || new Map<string | symbol, Spec<any>>()
	definitions.set(target.constructor, own)

	if (own.has(propertyKey)) fail('cannot have several env decorators')
	own.set(propertyKey, spec)
}

/** Options common to every variable type, as given to `register`. */
type CommonOptions = Var.Options<any> & Var.AllowEmpty & { optional?: boolean }

function register(steps: TypeSteps<any>, options: CommonOptions = {}): Var.Decorator<any> {
	const { name, choices, desc, docs, optional, allowEmpty, validate } = options
	const spec: Spec<any> = { ...steps, validateOption: validate, name, choices, desc, docs, optional, allowEmpty }
	return (target: object, propertyKey: string | symbol) => define(target, propertyKey, spec)
}

/**
 * Decorators of environment variables, by type, to be validated and injected by `Environment.load`.
 *
 * @example
 * ```ts
 * class Env extends Environment {
 *   ＠Var.Str()
 *   NODE_ENV!: string
 *
 *   ＠Var.Port()
 *   PORT = 3000
 *
 *   ＠Var.Bool()
 *   DEBUG = false
 * }
 *
 * const env = Env.load()
 * ```
 * ---
 * @public
 */
export namespace Var {
	/**
	 * A string variable, kept as is.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Str({ choices: ['json', 'pretty'] }) LOG_FORMAT: 'json' | 'pretty' = 'pretty'
	 * ＠Var.Str({ pattern: /^sk_/, minLength: 32 }) API_KEY!: string
	 * ```
	 * ---
	 * @public
	 */
	export const Str: Factory<string, StrOptions> = factory(str, (steps, options) =>
		lengthed(matching(steps, options), options)
	)

	/**
	 * A decimal number variable, e.g. `42`, `-1.5` or `1e3`.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Num({ min: 0, max: 1 }) SAMPLE_RATE = 0.1
	 * ```
	 * ---
	 * @public
	 */
	export const Num: Factory<number, NumOptions> = factory(num, bounded)

	/**
	 * A boolean variable: `true|false|1|0|yes|no|on|off`, case insensitive.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Bool() DEBUG = false
	 * ```
	 * ---
	 * @public
	 */
	export const Bool: Factory<boolean> = factory(bool)

	/**
	 * An integer port number, from 1 to 65535.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Port() PORT = 3000
	 * ```
	 * ---
	 * @public
	 */
	export const Port: Factory<number, NumOptions> = factory(port, bounded)

	/**
	 * An absolute URL with a scheme (e.g. `https://`), restricted to some protocols with `protocols`.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Url({ protocols: ['mongodb', 'mongodb+srv'] }) MONGO_URL!: string
	 * ```
	 * ---
	 * @public
	 */
	export const Url: Factory<string, UrlOptions> = factory(urlWith(undefined), (_, options) =>
		urlWith(options.protocols)
	)

	/**
	 * An email address.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Email() ADMIN_EMAIL!: string
	 * ```
	 * ---
	 * @public
	 */
	export const Email: Factory<string> = factory(email)

	/**
	 * A hostname or IP address, e.g. `localhost`, `db_1`, `example.com` or `::1`.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Host() DB_HOST = 'localhost'
	 * ```
	 * ---
	 * @public
	 */
	export const Host: Factory<string> = factory(host)

	/**
	 * A JSON-encoded value, untyped unless a type parameter is given. Values are deeply frozen.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Json<{ retries: number }>() RETRY_POLICY = { retries: 3 }
	 * ```
	 * ---
	 * @public
	 */
	export function Json<T = any>(options: JsonOptions<T> & Optional): Decorator<T | undefined>
	export function Json<T = any>(options?: JsonOptions<T>): Decorator<T>
	export function Json(options?: CommonOptions): Decorator<any> {
		return register(json, options)
	}
	Json.parse = parsable(json)

	/**
	 * Bytes of a string, as a `Buffer`, e.g. a cryptographic key or secret.
	 * Lengths are in bytes, and the encoding (`utf8` by default) is checked strictly.
	 *
	 * The type parameter narrows the buffer type without check, e.g. to a branded type.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Bytes({ encoding: 'hex', length: 32 }) CIPHER_KEY!: Buffer // CIPHER_KEY=$(openssl rand -hex 32)
	 * ```
	 * ---
	 * @public
	 */
	export function Bytes<T extends Buffer = Buffer>(options: BytesOptions & Optional): Decorator<T | undefined>
	export function Bytes<T extends Buffer = Buffer>(options?: BytesOptions): Decorator<T>
	export function Bytes(options: BytesOptions & CommonOptions = {}): Decorator<any> {
		return register(bytes(options), options)
	}
	Bytes.parse = parsable(bytes({}))

	/**
	 * Duration with units, in milliseconds: `ms`, `s`, `m`, `h` and `d`, combined or with decimals,
	 * e.g. `500ms`, `30s`, `1h30m` or `1.5d`. Default values are in milliseconds.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Duration({ max: '1h' }) TIMEOUT = 30_000 // TIMEOUT=45s
	 * ```
	 * ---
	 * @public
	 */
	export const Duration: SimpleFactory<number, AmountOptions> = simpleFactory(duration)

	/**
	 * Size in bytes, with decimal (`KB` = 1000) or binary (`KiB` = 1024) units, case insensitive:
	 * `B`, `KB`, `MB`, `GB`, `TB`, `KiB`, `MiB`, `GiB` and `TiB`, e.g. `512`, `10MB` or `1.5GiB`.
	 * Units can be combined, each one once, e.g. `1GB500MB`. A plain number is in bytes, as default values.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Size({ max: '1GB' }) UPLOAD_LIMIT = 10_000_000 // UPLOAD_LIMIT=50MB
	 * ```
	 * ---
	 * @public
	 */
	export const Size: SimpleFactory<number, AmountOptions> = simpleFactory(size)

	/**
	 * Path of an existing file, resolved to an absolute path.
	 * Relative paths are resolved from `base` (the current directory by default), absolute paths are kept as is.
	 *
	 * @example
	 * ```ts
	 * ＠Var.File({ readable: true }) TLS_CERT_PATH!: string
	 * ```
	 * ---
	 * @public
	 */
	export const File: SimpleFactory<string, PathOptions> = simpleFactory((options) => path('file', options))

	/**
	 * Path of an existing directory, resolved to an absolute path.
	 * Relative paths are resolved from `base` (the current directory by default), absolute paths are kept as is.
	 *
	 * @example
	 * ```ts
	 * ＠Var.Dir({ base: __dirname, writable: true }) UPLOADS_DIR = 'uploads'
	 * ```
	 * ---
	 * @public
	 */
	export const Dir: SimpleFactory<string, PathOptions> = simpleFactory((options) => path('directory', options))

	/**
	 * Variable with your own parser:
	 * - a function coercing the raw string, so default values are not validated,
	 * - or `coerce` and `validate` steps, so default values are validated as well (only `validate` for a string).
	 *
	 * Declare a `Parser` to reuse it, in several variables or as list items.
	 *
	 * @example
	 * ```ts
	 * const date: Parser<Date> = { coerce: (raw) => new Date(raw), validate: validDate }
	 *
	 * class Env extends Environment {
	 *   ＠Var.Custom(date) LAUNCH_DATE = new Date('2030-01-01') // validated as well
	 *   ＠Var.List(date) HOLIDAYS: Date[] = []
	 *   ＠Var.Custom((raw) => raw.split(';')) PARTS!: string[]
	 * }
	 * ```
	 * ---
	 * @public
	 */
	// A validate-only string parser first, then a coerce step (on which contextual typing would be fixed otherwise),
	// then a string parser declared with `Parser<string>`.
	export function Custom(
		parser: Parser.ValidateStep<string>,
		options: CustomOptions<string> & Optional
	): Decorator<string | undefined>
	export function Custom(parser: Parser.ValidateStep<string>, options?: CustomOptions<string>): Decorator<string>
	export function Custom<T>(
		parser: Parser.Coercer<T> | Parser.Steps<T>,
		options: CustomOptions<T> & Optional
	): Decorator<T | undefined>
	export function Custom<T>(parser: Parser.Coercer<T> | Parser.Steps<T>, options?: CustomOptions<T>): Decorator<T>
	export function Custom(
		parser: Parser<string>,
		options: CustomOptions<string> & Optional
	): Decorator<string | undefined>
	export function Custom(parser: Parser<string>, options?: CustomOptions<string>): Decorator<string>
	export function Custom(parser: Parser<any>, options?: CommonOptions): Decorator<any> {
		return register(custom(parser), options)
	}

	/**
	 * A list of values separated by commas (or another `separator`).
	 * Surrounding whitespace and empty items are removed, and values are deeply frozen.
	 * Items are parsed by a built-in type (e.g. `Var.Port`) or a custom parser, strings by default.
	 *
	 * @example
	 * ```ts
	 * ＠Var.List(Var.Port) PORTS!: number[] // PORTS=80,443
	 * ```
	 * ---
	 * @public
	 */
	export function List<T>(item: Parsable<T>, options: ListOptions<T> & Optional): Decorator<T[] | undefined>
	export function List(
		item: Parser.ValidateStep<string>,
		options: ListOptions<string> & Optional
	): Decorator<string[] | undefined>
	export function List<T>(
		item: Parser.Coercer<T> | Parser.Steps<T>,
		options: ListOptions<T> & Optional
	): Decorator<T[] | undefined>
	export function List(item: Parser<string>, options: ListOptions<string> & Optional): Decorator<string[] | undefined>
	export function List(item: undefined, options: ListOptions<string> & Optional): Decorator<string[] | undefined>
	export function List<T>(item: Parsable<T>, options?: ListOptions<T>): Decorator<T[]>
	export function List(item: Parser.ValidateStep<string>, options?: ListOptions<string>): Decorator<string[]>
	export function List<T>(item: Parser.Coercer<T> | Parser.Steps<T>, options?: ListOptions<T>): Decorator<T[]>
	export function List(item: Parser<string>, options?: ListOptions<string>): Decorator<string[]>
	export function List(item?: undefined, options?: ListOptions<string>): Decorator<string[]>
	export function List(
		item: Parsable<any> | Parser<any> = Str,
		options: ListOptions<any> & CommonOptions = {}
	): Decorator<any> {
		return register(list(itemSteps(item), options.separator ?? ','), options)
	}

	/**
	 * Property decorator that checks the decorated property can hold the parsed value of type `T`.
	 * Decorated properties must be public, and cannot be static, methods or accessors.
	 * @public
	 */
	export type Decorator<T> = <X extends object, K extends keyof X & (string | symbol)>(
		target: X extends Function ? never : X,
		propertyKey: K &
			([T] extends [X[K]] ? unknown : { 'Type of the parsed value is not assignable to the property': T }),
		descriptor?: undefined
	) => void

	/**
	 * Options of every variable type.
	 * @public
	 */
	export interface Options<T> {
		/**
		 * Override the env variable name (defaults to the property key).
		 * With several names, the first one set is used, e.g. to rename a variable without breaking deployments.
		 */
		name?: string | readonly string[]

		/** Restricts the value to one of the given choices, which narrows the type. */
		choices?: ReadonlyArray<T>

		/**
		 * Additional validation of the value, after the one of its type and its choices, for environment values and defaults.
		 * Return the value (possibly normalized), or throw to signal an invalid value.
		 */
		validate?: Parser.Validator<T>

		/** Description of the variable, included in error messages. */
		desc?: string

		/** URL to documentation of the variable, included in error messages. */
		docs?: string
	}

	/**
	 * Option of an optional variable, whose property must be optional: `undefined` when missing.
	 * @public
	 */
	export interface Optional {
		/** The variable is not required: `undefined` when missing. */
		optional: true
	}

	/**
	 * Option of types whose empty value can be valid.
	 * @public
	 */
	export interface AllowEmpty {
		/** An empty value (`VAR=`) is a value, not a missing variable. */
		allowEmpty?: boolean
	}

	/**
	 * Options of a string variable.
	 * @public
	 */
	export interface StrOptions extends AllowEmpty {
		/** The value must match this pattern. */
		pattern?: RegExp
		/** Minimum length, in characters. */
		minLength?: number
		/** Maximum length, in characters. */
		maxLength?: number
	}

	/**
	 * Options of a number variable.
	 * @public
	 */
	export interface NumOptions {
		/** Minimum value, included. */
		min?: number
		/** Maximum value, included. */
		max?: number
		/** The value must be an integer. */
		int?: boolean
	}

	/**
	 * Options of a URL variable.
	 * @public
	 */
	export interface UrlOptions {
		/** Allowed protocols, without `:`, e.g. `['https']` or `['postgres', 'postgresql']`. */
		protocols?: readonly string[]
	}

	/**
	 * Options of a JSON variable, whose values can't be compared to choices.
	 * @public
	 */
	export type JsonOptions<T> = Omit<Options<T>, 'choices'>

	/**
	 * Options of a bytes variable.
	 * @public
	 */
	export interface BytesOptions extends Omit<Options<Buffer>, 'choices'> {
		/** Encoding of the value, `utf8` by default. */
		encoding?: 'utf8' | 'hex' | 'base64' | 'base64url'
		/** Exact length, in bytes. */
		length?: number
		/** Minimum length, in bytes. */
		minLength?: number
		/** Maximum length, in bytes. */
		maxLength?: number
	}

	/**
	 * Options of a duration or size variable.
	 * @public
	 */
	export interface AmountOptions {
		/** Minimum value, included: in the base unit, or with units, e.g. `'1s'` or `'1KB'`. */
		min?: number | string
		/** Maximum value, included: in the base unit, or with units, e.g. `'1h'` or `'1GB'`. */
		max?: number | string
	}

	/**
	 * Options of a file or directory variable, checked when the environment is loaded only.
	 * @public
	 */
	export interface PathOptions {
		/** Directory of relative paths, the current directory by default. */
		base?: string
		/** The file or directory must be readable. */
		readable?: boolean
		/** The file or directory must be writable. */
		writable?: boolean
	}

	/**
	 * Options of a custom variable.
	 * @public
	 */
	export interface CustomOptions<T> extends Options<T>, AllowEmpty {}

	/**
	 * Options of a list variable.
	 * @public
	 */
	export interface ListOptions<T> extends Omit<Options<T[]>, 'choices'>, AllowEmpty {
		/** Defaults to `,`. */
		separator?: string
	}

	/**
	 * Restricts the value to one of the given choices, which narrows the type.
	 * @public
	 */
	export interface WithChoices<T> {
		choices: ReadonlyArray<T>
	}

	/**
	 * Variable type whose parser can be reused, e.g. for list items: `Var.Str.parse(raw, name)`.
	 * @public
	 */
	export interface Parsable<T> {
		parse: Parser.Coercer<T>
	}

	/**
	 * Decorator factory of a variable type, whose choices narrow the type.
	 * With `optional`, the decorated property must be optional.
	 * @public
	 */
	export interface Factory<T, O = {}> extends Parsable<T> {
		<C extends T>(options: Options<C> & O & WithChoices<C> & Optional): Decorator<C | undefined>
		(options: Options<T> & O & Optional): Decorator<T | undefined>
		<C extends T>(options: Options<C> & O & WithChoices<C>): Decorator<C>
		(options?: Options<T> & O): Decorator<T>
	}

	/**
	 * Decorator factory of a variable type without choices.
	 * With `optional`, the decorated property must be optional.
	 * @public
	 */
	export interface SimpleFactory<T, O = {}> extends Parsable<T> {
		(options: Omit<Options<T>, 'choices'> & O & Optional): Decorator<T | undefined>
		(options?: Omit<Options<T>, 'choices'> & O): Decorator<T>
	}
}

/**
 * Checks the pattern option of a string variable.
 */
function matching(steps: TypeSteps<string>, { pattern }: Var.StrOptions): TypeSteps<string> {
	if (!pattern) return steps
	return withValidation(steps, (value, name) => {
		// A global or sticky pattern is stateful.
		pattern.lastIndex = 0
		if (!pattern.test(value)) throw new Error(`"${name}" must match ${pattern}`)
		return value
	})
}

/**
 * Checks the length options of a string variable.
 */
function lengthed(steps: TypeSteps<string>, { minLength, maxLength }: Var.StrOptions): TypeSteps<string> {
	if (minLength === undefined && maxLength === undefined) return steps
	return withValidation(steps, (value, name) => {
		if (minLength !== undefined && value.length < minLength) {
			throw new Error(`"${name}" must be at least ${minLength} characters`)
		}
		if (maxLength !== undefined && value.length > maxLength) {
			throw new Error(`"${name}" must be at most ${maxLength} characters`)
		}
		return value
	})
}

/**
 * Checks the bounds options of a number variable.
 */
function bounded(steps: TypeSteps<number>, { min, max, int }: Var.NumOptions): TypeSteps<number> {
	if (min === undefined && max === undefined && !int) return steps
	return withValidation(steps, (value, name) => {
		if (int && !Number.isInteger(value)) throw new Error(`"${name}" must be an integer`)
		if (min !== undefined && value < min) throw new Error(`"${name}" must be at least ${min}`)
		if (max !== undefined && value > max) throw new Error(`"${name}" must be at most ${max}`)
		return value
	})
}

function parsable<T>(steps: TypeSteps<T>): Parser.Coercer<T> {
	const parse = parseWith(steps)
	STEPS.set(parse, steps)
	return parse
}

/**
 * Factory of a variable type, whose steps may depend on its options.
 */
function factory<T, O>(
	steps: TypeSteps<T>,
	withOptions: (steps: TypeSteps<T>, options: O) => TypeSteps<T> = (s) => s
): Var.Factory<T, O> {
	const decorate = (options: any = {}) => register(withOptions(steps, options), options)
	return Object.assign(decorate, { parse: parsable(steps) }) as Var.Factory<T, O>
}

/**
 * Factory of a variable type without choices, whose steps depend on its options.
 */
function simpleFactory<T, O>(steps: (options: O) => TypeSteps<T>): Var.SimpleFactory<T, O> {
	const decorate = (options: any = {}) => register(steps(options), options)
	return Object.assign(decorate, { parse: parsable(steps({} as O)) }) as Var.SimpleFactory<T, O>
}

/**
 * Steps of list items: of a built-in type, or of a custom parser.
 */
function itemSteps(item: Var.Parsable<any> | Parser<any>): TypeSteps<any> {
	const parse = (item as Var.Parsable<any>).parse
	if (typeof parse !== 'function') return custom(item as Parser<any>)
	// Items of other parsable objects are only coerced by their parser.
	return STEPS.get(parse) || { coerce: parse, validate: (value) => value, isEmpty: (raw) => raw.trim() === '' }
}

/**
 * Specs of the class and its ancestors, parents' first.
 * A subclass can redefine a parent property, which keeps its position.
 * @internal
 */
export function extractSpecs(target: ClassType): Map<string | symbol, Spec<any>> {
	const all = new Map<string | symbol, Spec<any>>()
	for (const cls of ancestry(target).reverse()) {
		for (const [key, spec] of definitions.get(cls) || []) all.set(key, spec)
	}
	return all
}
