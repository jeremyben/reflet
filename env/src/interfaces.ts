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
	/** Default value used when the variable is missing in any environment. */
	default?: T

	/** Default value used only when `NODE_ENV` is not `production`. */
	devDefault?: T

	/** Restricts the value to one of the given choices. */
	choices?: ReadonlyArray<T>

	/** Description used in error messages and documentation. */
	desc?: string

	/** Custom example value used in error messages and documentation. */
	example?: string

	/** Override the env variable name (defaults to the property key). */
	name?: string
}

/**
 * @public
 */
export interface Spec<T> extends SpecOptions<T> {
	parser: Parser<T>
	type: string
}
