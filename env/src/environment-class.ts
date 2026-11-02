import { inspect, InspectOptions } from 'util'
import { load } from './load'
import { masked } from './mask'
import type { ClassType } from './interfaces'

/**
 * Base class of an environment, whose decorated properties are validated and typed by `load`.
 *
 * The constructor is protected, so an environment cannot be created without validation.
 *
 * @example
 * ```ts
 * class Env extends Environment {
 *   ＠Var.Str({ choices: ['development', 'production', 'test'] })
 *   NODE_ENV!: 'development' | 'production' | 'test'
 *
 *   ＠Var.Port()
 *   PORT = 3000
 *
 *   get isProduction() {
 *     return this.NODE_ENV === 'production'
 *   }
 * }
 *
 * export const env = Env.load()
 * env.PORT // number
 * ```
 * ---
 * @public
 */
export abstract class Environment {
	/**
	 * Validates all the variables of the source, and returns a frozen instance of the environment class.
	 *
	 * @param source - defaults to `process.env`.
	 * @throws EnvValidationError - when variables are missing or invalid.
	 */
	static load<T extends Environment>(this: { prototype: T }, source?: Environment.Source): T {
		if ((this as unknown) === Environment) {
			throw new Error('`load` must be called on a class extending `Environment`.')
		}
		return load(this as unknown as ClassType<T>, source)
	}

	protected constructor() {}

	/**
	 * Used by `JSON.stringify`: sensitive variables are masked.
	 */
	toJSON(): Record<string, unknown> {
		return masked(this) as Record<string, unknown>
	}

	/**
	 * Used by `console.log` and `util.inspect`: sensitive variables are masked.
	 */
	[inspect.custom](depth: number, options: InspectOptions): string {
		return `${this.constructor.name} ${inspect(masked(this), options)}`
	}
}

/**
 * @public
 */
export namespace Environment {
	/**
	 * Source of the variables, `process.env` by default.
	 * @public
	 */
	export type Source = Record<string, string | undefined>
}
