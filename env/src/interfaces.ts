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
	/**
	 * Default value used when the variable is missing, in any environment.
	 *
	 * Precedence when several defaults are defined:
	 * `testDefault` (if `NODE_ENV=test`) > `default` > `devDefault` (if `NODE_ENV !== production`).
	 */
	default?: T

	/**
	 * Default value used only when `NODE_ENV` is not `production`
	 * (i.e. `development`, `test`, or anything else).
	 *
	 * Overridden by `testDefault` when `NODE_ENV === 'test'`,
	 * and by `default` when both are defined.
	 */
	devDefault?: T

	/**
	 * Default value used only when `NODE_ENV === 'test'`.
	 *
	 * Takes precedence over `default` and `devDefault` — useful when you need
	 * a test-specific value distinct from your generic dev fallback.
	 */
	testDefault?: T

	/** Restricts the value to one of the given choices. */
	choices?: ReadonlyArray<T>

	/** Description used in error messages and documentation. */
	desc?: string

	/** Custom example value used in error messages and documentation. */
	example?: string

	/** URL to documentation for this variable, included in error messages. */
	docs?: string

	/**
	 * The variable is only required when this predicate returns `true`.
	 * The predicate is called with an object containing already-validated env values.
	 */
	requiredWhen?: (env: any) => boolean

	/** Override the env variable name (defaults to the property key). */
	name?: string
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
 * Auto-injected boolean shortcuts derived from `NODE_ENV`.
 * @public
 */
export interface EnvShortcuts {
	readonly isProduction: boolean
	readonly isDev: boolean
	readonly isTest: boolean
}

/**
 * @public
 */
export interface Spec<T> extends SpecOptions<T> {
	parser: Parser<T>
	type: string
}
