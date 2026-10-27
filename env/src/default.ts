import type { EnvSource } from './interfaces'

/**
 * Default values computed in property initializers, depending on the environment.
 *
 * An `undefined` value is not a default: the variable is required in this environment.
 * ---
 * @public
 */
export namespace Default {
	/**
	 * Picks a default value by `NODE_ENV`: the value of the current `NODE_ENV`, or else `default`.
	 * An `undefined` value (or none at all) is not a default: the variable is required in this environment.
	 *
	 * `NODE_ENV` is read from the source being loaded (`process.env` by default, or outside of `load`).
	 *
	 * @example
	 * ```ts
	 * class Env extends Environment {
	 *   ＠Var.Bool()
	 *   MONGO_TLS = Default.byNodeEnv({ production: true, default: false })
	 *
	 *   ＠Var.Url()
	 *   APP_ORIGIN = Default.byNodeEnv({ development: 'http://localhost:4000', test: 'http://localhost:4000' })
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function byNodeEnv<T>(values: PickValues<'development' | 'production' | 'test', T>): T {
		return pick(read('NODE_ENV'), values)
	}

	/**
	 * Creates a picker of default values by another variable than `NODE_ENV`, e.g. `APP_ENV`,
	 * or by other `NODE_ENV` values than `development`, `production` and `test`.
	 * The type parameter lists the environment names, so they are checked.
	 *
	 * The variable is read from the source being loaded (`process.env` by default, or outside of `load`).
	 *
	 * @example
	 * ```ts
	 * const byAppEnv = Default.by<'local' | 'staging' | 'production'>('APP_ENV')
	 *
	 * class Env extends Environment {
	 *   ＠Var.Host()
	 *   MAIL_DOMAIN = byAppEnv({ production: 'example.com', default: 'staging.example.com' })
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function by<K extends string = string>(variable: string): Picker<K> {
		return (values) => pick(read(variable), values)
	}

	/**
	 * Picks a default value by environment name, or else `default`.
	 * @public
	 */
	export type Picker<K extends string> = <T>(values: PickValues<K, T>) => T

	/**
	 * Default values by environment name, and `default` for the other environments.
	 * @public
	 */
	export type PickValues<K extends string, T> = { readonly [P in K | 'default']?: T }
}

function pick(name: string | undefined, values: Record<string, any>) {
	return name !== undefined && Object.prototype.hasOwnProperty.call(values, name) ? values[name] : values.default
}

/** Source being loaded, while property initializers run. */
let loading: EnvSource | undefined

/**
 * Runs the property initializers of an environment, with defaults picked from the source being loaded.
 * @internal
 */
export function initializing<T>(source: EnvSource, construct: () => T): T {
	const previous = loading
	loading = source
	try {
		return construct()
	} finally {
		loading = previous
	}
}

function read(variable: string): string | undefined {
	const source = loading ?? process.env
	return Object.prototype.hasOwnProperty.call(source, variable) ? source[variable] : undefined
}
