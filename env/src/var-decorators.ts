import { parseBool, parseEmail, parseHost, parseJson, parseNum, parsePort, parseStr, parseUrl } from './parsers'
import type { Environment } from './init'
import type { ClassType, ConditionalOptions, Parser, Spec, SpecOptions } from './interfaces'

/** Own specs of each class, in declaration order. */
const definitions = new WeakMap<object, Map<string | symbol, Spec<any>>>()

/** Secret directories of each class, defined by `Var.Secrets`. */
const secretsDirs = new WeakMap<object, readonly string[]>()

/**
 * Fails on definitions that would otherwise be silently ignored or overridden.
 * Redefining a parent property in a subclass is fine.
 */
function define(target: object, propertyKey: string | symbol, spec: Spec<any>): void {
	// Standard decorators (without the TypeScript option) receive a context object instead.
	if (target === undefined || (typeof propertyKey === 'object' && propertyKey !== null)) {
		throw new Error('@reflet/env decorators require the "experimentalDecorators" TypeScript option.')
	}

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

type AnyOptions = SpecOptions<any> &
	Partial<ConditionalOptions<any>> &
	Var.AllowEmpty & {
		pattern?: RegExp
		minLength?: number
		maxLength?: number
		min?: number
		max?: number
		int?: boolean
		parseDefault?: boolean
	}

function register(type: string, parser: Parser<any>, options: AnyOptions = {}): Var.Decorator<any> {
	return (target: object, propertyKey: string | symbol) => define(target, propertyKey, { type, parser, ...options })
}

/**
 * Marks a class property as an environment variable to be validated and injected.
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
	 * Property decorator that checks the decorated property can hold the parsed value of type `T`,
	 * and that the decorated class matches `C` (the `requiredWhen` predicate parameter).
	 * Decorated properties must be public, and cannot be static, methods or accessors.
	 * @public
	 */
	export type Decorator<T, C = unknown> = <X extends C & object, K extends keyof X & (string | symbol)>(
		target: X extends Function ? never : X,
		propertyKey: K &
			([T] extends [X[K]] ? unknown : { 'Type of the parsed value is not assignable to the property': T }),
		descriptor?: undefined
	) => void

	/** A string env variable. @public */
	export function Str<T extends string, C = any>(
		options: StrOptions<T> & WithChoices<T> & ConditionalOptions<C>
	): Decorator<T | undefined, C>
	export function Str<C = any>(options: StrOptions<string> & ConditionalOptions<C>): Decorator<string | undefined, C>
	export function Str<T extends string>(options: StrOptions<T> & WithChoices<T>): Decorator<T>
	export function Str(options?: StrOptions<string>): Decorator<string>
	export function Str(options: AnyOptions = {}): Decorator<any> {
		return register('str', lengthed(matching(parseStr, options), options), options)
	}
	Str.parse = parseStr

	/** A number env variable. @public */
	export function Num<T extends number, C = any>(
		options: NumOptions<T> & WithChoices<T> & ConditionalOptions<C>
	): Decorator<T | undefined, C>
	export function Num<C = any>(options: NumOptions<number> & ConditionalOptions<C>): Decorator<number | undefined, C>
	export function Num<T extends number>(options: NumOptions<T> & WithChoices<T>): Decorator<T>
	export function Num(options?: NumOptions<number>): Decorator<number>
	export function Num(options: AnyOptions = {}): Decorator<any> {
		return register('num', bounded(parseNum, options), options)
	}
	Num.parse = parseNum

	/** A boolean env variable. Accepts `true|false|1|0|yes|no|on|off`. @public */
	export const Bool = factory('bool', parseBool)

	/** An integer port number (1-65535). @public */
	export function Port<T extends number, C = any>(
		options: NumOptions<T> & WithChoices<T> & ConditionalOptions<C>
	): Decorator<T | undefined, C>
	export function Port<C = any>(options: NumOptions<number> & ConditionalOptions<C>): Decorator<number | undefined, C>
	export function Port<T extends number>(options: NumOptions<T> & WithChoices<T>): Decorator<T>
	export function Port(options?: NumOptions<number>): Decorator<number>
	export function Port(options: AnyOptions = {}): Decorator<any> {
		return register('port', bounded(parsePort, options), options)
	}
	Port.parse = parsePort

	/** An absolute URL with a scheme (e.g. `https://`). @public */
	export const Url = factory('url', parseUrl)

	/** An email address. @public */
	export const Email = factory('email', parseEmail)

	/** A hostname or IP address. @public */
	export const Host = factory('host', parseHost)

	/** A JSON-encoded value, untyped unless a type parameter is given. @public */
	export function Json<T = any, C = any>(options: SpecOptions<T> & ConditionalOptions<C>): Decorator<T | undefined, C>
	export function Json<T = any>(options?: SpecOptions<T>): Decorator<T>
	export function Json(options?: AnyOptions): Decorator<any> {
		return register('json', parseJson, options)
	}
	Json.parse = parseJson

	/**
	 * Custom env variable with a user-supplied parser.
	 * @public
	 */
	export function Custom<T, C = any>(
		parser: Parser<T>,
		options: CustomOptions<T> & ConditionalOptions<C>
	): Decorator<T | undefined, C>
	export function Custom<T>(parser: Parser<T>, options?: CustomOptions<T>): Decorator<T>
	export function Custom(parser: Parser<any>, options?: AnyOptions): Decorator<any> {
		return register('custom', parser, options)
	}

	/**
	 * A list of values separated by commas (or another `separator`).
	 * Surrounding whitespace and empty items are removed.
	 * Items are parsed by another variable type, strings by default.
	 *
	 * @example
	 * ```ts
	 * ＠Var.List(Var.Port) PORTS!: number[] // PORTS=80,443
	 * ```
	 * ---
	 * @public
	 */
	export function List<T, C = any>(
		item: Parsable<T>,
		options: ListOptions<T> & ConditionalOptions<C>
	): Decorator<T[] | undefined, C>
	export function List<C = any>(
		item: undefined,
		options: ListOptions<string> & ConditionalOptions<C>
	): Decorator<string[] | undefined, C>
	export function List<T>(item: Parsable<T>, options?: ListOptions<T>): Decorator<T[]>
	export function List(item?: undefined, options?: ListOptions<string>): Decorator<string[]>
	export function List(item: Parsable<any> = Str, options: ListOptions<any> & AnyOptions = {}): Decorator<any> {
		const separator = options.separator ?? ','
		const parseList: Parser<any[]> = (raw, name) =>
			raw
				.split(separator)
				.map((value) => value.trim())
				.filter((value) => value !== '')
				.map((value, index) => item.parse(value, `${name}[${index}]`))
		return (target: object, propertyKey: string | symbol) => {
			const itemSpec = { type: PARSER_TYPES.get(item.parse) || 'custom', parser: item.parse }
			define(target, propertyKey, { type: 'list', parser: parseList, item: itemSpec, ...options })
		}
	}

	/**
	 * Options of a list variable.
	 * @public
	 */
	export interface ListOptions<T> extends Omit<SpecOptions<T[]>, 'choices'>, AllowEmpty {
		/** Defaults to `,`. */
		separator?: string
	}

	/**
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
	export interface StrOptions<T> extends SpecOptions<T>, AllowEmpty {
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
	export interface NumOptions<T> extends SpecOptions<T> {
		/** Minimum value, included. */
		min?: number
		/** Maximum value, included. */
		max?: number
		/** The value must be an integer. */
		int?: boolean
	}

	/**
	 * Options of a custom variable.
	 * @public
	 */
	export interface CustomOptions<T> extends SpecOptions<T>, AllowEmpty {
		/**
		 * A string default value (property initializer) is parsed like an environment value,
		 * e.g. a relative path resolved and checked by the parser.
		 */
		parseDefault?: boolean
	}

	/**
	 * Reads variables from secret files named like them, in the given directories,
	 * e.g. `process.env.CREDENTIALS_DIRECTORY` with systemd, or `/run/secrets` with Docker.
	 *
	 * - Undefined directories are ignored, and environment variables take precedence over secret files.
	 * - Subclasses inherit the directories, unless they define their own (none with `＠Var.Secrets()`).
	 *
	 * @example
	 * ```ts
	 * ＠Var.Secrets(process.env.CREDENTIALS_DIRECTORY)
	 * class Env extends Environment {
	 *   ＠Var.Str({ sensitive: true }) DB_PASSWORD!: string
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Secrets(...dirs: (string | undefined)[]): (target: Function & { prototype: Environment }) => void {
		return (target) => {
			if (secretsDirs.has(target)) throw new Error(`"${target.name}" cannot have several secrets decorators.`)
			secretsDirs.set(
				target,
				dirs.filter((dir): dir is string => typeof dir === 'string' && dir !== '')
			)
		}
	}

	/**
	 * Restricts the value to one of the given choices, which narrows the type.
	 * @public
	 */
	export interface WithChoices<T> {
		choices: ReadonlyArray<T>
	}

	/**
	 * Variable type whose parser can be reused, e.g. for list items.
	 * @public
	 */
	export interface Parsable<T> {
		parse: Parser<T>
	}

	/**
	 * Decorator factory of a non-generic type.
	 * With `requiredWhen`, the decorated property must be optional.
	 * @public
	 */
	export interface Factory<T> extends Parsable<T> {
		<C>(options: SpecOptions<T> & ConditionalOptions<C>): Decorator<T | undefined, C>
		(options?: SpecOptions<T>): Decorator<T>
	}
}

/**
 * Checks the pattern option of a string variable.
 */
function matching(parser: Parser<string>, { pattern }: AnyOptions): Parser<string> {
	if (!pattern) return parser
	return (raw, name) => {
		const value = parser(raw, name)
		// A global or sticky pattern is stateful.
		pattern.lastIndex = 0
		if (!pattern.test(value)) throw new Error(`"${name}" must match ${pattern}`)
		return value
	}
}

/**
 * Checks the length options of a string variable.
 */
function lengthed(parser: Parser<string>, { minLength, maxLength }: AnyOptions): Parser<string> {
	if (minLength === undefined && maxLength === undefined) return parser
	return (raw, name) => {
		const value = parser(raw, name)
		if (minLength !== undefined && value.length < minLength) {
			throw new Error(`"${name}" must be at least ${minLength} characters`)
		}
		if (maxLength !== undefined && value.length > maxLength) {
			throw new Error(`"${name}" must be at most ${maxLength} characters`)
		}
		return value
	}
}

/**
 * Checks the bounds options of a number variable.
 */
function bounded(parser: Parser<number>, { min, max, int }: AnyOptions): Parser<number> {
	if (min === undefined && max === undefined && !int) return parser
	return (raw, name) => {
		const value = parser(raw, name)
		if (int && !Number.isInteger(value)) throw new Error(`"${name}" must be an integer`)
		if (min !== undefined && value < min) throw new Error(`"${name}" must be at least ${min}`)
		if (max !== undefined && value > max) throw new Error(`"${name}" must be at most ${max}`)
		return value
	}
}

/** Types of built-in parsers, e.g. to check the defaults of list items. */
const PARSER_TYPES = new Map<Parser<any>, string>([
	[parseStr, 'str'],
	[parseNum, 'num'],
	[parseBool, 'bool'],
	[parsePort, 'port'],
	[parseUrl, 'url'],
	[parseEmail, 'email'],
	[parseHost, 'host'],
	[parseJson, 'json'],
])

function factory<T>(type: string, parser: Parser<T>): Var.Factory<T> {
	const decorate = (options?: AnyOptions) => register(type, parser, options)
	return Object.assign(decorate, { parse: parser }) as Var.Factory<T>
}

/**
 * Secret directories of the closest class defining them.
 * @internal
 */
export function extractSecretsDirs(target: ClassType): readonly string[] {
	for (let cls = target; cls && cls !== Function.prototype; cls = Object.getPrototypeOf(cls)) {
		const dirs = secretsDirs.get(cls)
		if (dirs) return dirs
	}
	return []
}

/**
 * Specs of the class and its ancestors, parents' first.
 * A subclass can redefine a parent property, which keeps its position.
 * @internal
 */
export function extractSpecs(target: ClassType): Map<string | symbol, Spec<any>> {
	const ancestors: ClassType[] = []
	for (let cls = target; cls && cls !== Function.prototype; cls = Object.getPrototypeOf(cls)) {
		ancestors.unshift(cls)
	}

	const all = new Map<string | symbol, Spec<any>>()
	for (const cls of ancestors) {
		for (const [key, spec] of definitions.get(cls) || []) all.set(key, spec)
	}
	return all
}
