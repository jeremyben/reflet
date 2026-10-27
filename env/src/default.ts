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
	 * `NODE_ENV` is read when the environment is loaded.
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
		return pick(process.env.NODE_ENV, values)
	}

	/**
	 * Creates a picker of default values by another environment name than `NODE_ENV`, e.g. `APP_ENV`,
	 * or by other `NODE_ENV` values than `development`, `production` and `test`.
	 * The type parameter lists the environment names, so they are checked.
	 *
	 * @example
	 * ```ts
	 * const byAppEnv = Default.by<'local' | 'staging' | 'production'>(process.env.APP_ENV)
	 *
	 * class Env extends Environment {
	 *   ＠Var.Host()
	 *   MAIL_DOMAIN = byAppEnv({ production: 'example.com', default: 'staging.example.com' })
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function by<K extends string = string>(name: string | undefined): Picker<K> {
		return (values) => pick(name, values)
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
