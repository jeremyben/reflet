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
	 * Never include the raw value in error messages (secrets, credentials, tokens...),
	 * and mask it in `console.log`, `util.inspect` and `JSON.stringify` outputs.
	 * Note that custom parsers are responsible for not leaking the value in their own errors.
	 */
	sensitive?: boolean

	/**
	 * Override the env variable name (defaults to the property key).
	 * With several names, the first one set is used, e.g. to rename a variable without breaking deployments.
	 */
	name?: string | readonly string[]
}

/**
 * Options of a conditionally required variable, whose property must be optional.
 * @public
 */
export interface ConditionalOptions<C> {
	/**
	 * The variable is only required when this predicate returns `true`.
	 * The predicate is called with the env instance (getters included),
	 * which holds the already-validated non-conditional values, and conditional values declared before.
	 * A variable with a default value (property initializer) is never missing, so the predicate is not called.
	 *
	 * Annotate the parameter with your class, so it is checked against the decorated class.
	 */
	requiredWhen: (env: C) => boolean
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
export interface Spec<T> extends SpecOptions<T>, Partial<ConditionalOptions<any>> {
	parser: Parser<T>
	type: string
	/** Spec of list items. */
	item?: { type: string; parser: Parser<any> }
}
