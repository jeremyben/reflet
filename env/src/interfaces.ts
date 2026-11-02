/**
 * Parser of a custom variable, for `Var.Custom` and `Var.List`:
 * - a function coercing the raw string, so default values are not validated,
 * - or `coerce` and `validate` steps, so default values are validated as well (only `validate` for a string).
 *
 * Throw to signal an invalid value, and return a value (`null` included, but not `undefined`).
 *
 * @example
 * ```ts
 * const date: Parser<Date> = {
 *   coerce: (raw) => new Date(raw),
 *   validate: (value, name) => {
 *     if (Number.isNaN(value.getTime())) throw new Error(`"${name}" must be a date`)
 *     return value
 *   },
 * }
 * ```
 * ---
 * @public
 */
export type Parser<T> = Parser.Coercer<T> | Parser.Steps<T> | (string extends T ? Parser.ValidateStep<T> : never)

/**
 * Steps of a parser.
 * @public
 */
export namespace Parser {
	/**
	 * Function that coerces a raw env string into a typed value.
	 * @public
	 */
	export type Coercer<T> = (raw: string, name: string) => T

	/**
	 * Function that validates a typed value, e.g. a default value, and returns it (possibly normalized).
	 * @public
	 */
	export type Validator<T> = (value: T, name: string) => T

	/**
	 * Parser with a `coerce` step, and possibly a `validate` one.
	 * @public
	 */
	export interface Steps<T> {
		coerce: Coercer<T>
		validate?: Validator<T>
	}

	/**
	 * Parser of a string with only a `validate` step.
	 * @public
	 */
	export interface ValidateStep<T> {
		coerce?: undefined
		validate: Validator<T>
	}
}

/**
 * @internal
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * Parsing of a variable type in two steps: coercion of the raw string to the type, then validation of the typed value.
 * Default values (property initializers) are already typed, so they are only validated.
 * @internal
 */
export interface TypeSteps<T> {
	coerce: Parser.Coercer<T>
	validate: Parser.Validator<T>
	/** A raw value is missing when empty, e.g. whitespace-only for trimmed types. */
	isEmpty: (raw: string) => boolean
	/** Values are deeply frozen, e.g. JSON and lists. */
	freeze?: boolean
	/** Boolean values, which can be the flag of a group. */
	flag?: boolean
}

/**
 * Definition of a variable.
 * @internal
 */
export interface Spec<T> extends TypeSteps<T> {
	/** The `validate` option, after the type validation and choices. */
	validateOption?: Parser.Validator<T>
	name?: string | readonly string[]
	choices?: ReadonlyArray<T>
	desc?: string
	docs?: string
	optional?: boolean
	allowEmpty?: boolean
}
