/**
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * @public
 */
export type EnvSource = Record<string, string | undefined>

/**
 * Function that parses (and validates) a raw env string into a typed value.
 * Throw to signal an invalid value.
 * @public
 */
export type Parser<T> = (raw: string, name: string) => T

/**
 * Function that validates a typed value, e.g. a default value, and returns it (possibly normalized).
 * Throw to signal an invalid value.
 * @public
 */
export type Validator<T> = (value: T, name: string) => T

/**
 * @public
 */
export interface SpecOptions<T> {
	/** Restricts the value to one of the given choices. */
	choices?: ReadonlyArray<T>

	/** Description used in error messages and documentation. */
	desc?: string

	/** Custom example value used in error messages and documentation. */
	example?: string

	/** URL to documentation for this variable, included in error messages. */
	docs?: string

	/**
	 * Override the env variable name (defaults to the property key).
	 * With several names, the first one set is used, e.g. to rename a variable without breaking deployments.
	 */
	name?: string | readonly string[]
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
 * @public
 */
export interface EnvErrorEntry {
	name: string
	kind: 'missing' | 'invalid'
	message: string
	desc?: string
	example?: string
	docs?: string
}

/**
 * @public
 */
export interface Spec<T> extends SpecOptions<T> {
	optional?: boolean
	/** Coerces the raw string to the type. */
	coerce: Parser<T>
	/** Validates a typed value: a coerced value, or a default value. */
	validate: Validator<T>
	type: string
	allowEmpty?: boolean
	/** Separator of list items. */
	separator?: string
}
