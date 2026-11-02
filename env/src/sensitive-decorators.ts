import { classOrProperty } from './metadata-map'
import type { Environment } from './environment-class'

/**
 * Marks a variable as sensitive, or every variable when applied to the class (except `NODE_ENV`):
 * its value is left out of error messages, and masked by `console.log`, `util.inspect` and `JSON.stringify`.
 *
 * @example
 * ```ts
 * class Env extends Environment {
 *   ＠Sensitive()
 *   ＠Var.Url()
 *   DATABASE_URL!: string
 *
 *   ＠Sensitive({ reveal: 4 })
 *   ＠Var.Str()
 *   STRIPE_KEY!: string // '***4242'
 * }
 * ```
 * ---
 * @public
 */
export function Sensitive(sensitiveOptions: Sensitive.Options = {}): Sensitive.Decorator {
	const { reveal } = sensitiveOptions
	if (reveal !== undefined && !(Number.isInteger(reveal) && reveal > 0)) {
		throw new Error(`@Sensitive "reveal" option must be a positive integer.`)
	}

	return ((target: object, propertyKey?: string | symbol) =>
		classOrProperty('Sensitive', target, propertyKey, (options, key) => {
			if (key === undefined) {
				if (options.sensitive) return false
				options.sensitive = sensitiveOptions
				return true
			}
			if (options.sensitiveKeys.has(key)) return false
			options.sensitiveKeys.set(key, sensitiveOptions)
			return true
		})) as Sensitive.Decorator
}

/**
 * @public
 */
export namespace Sensitive {
	/**
	 * Options of a sensitive variable.
	 * @public
	 */
	export interface Options {
		/**
		 * Number of last characters to show (of the hexadecimal form for bytes), e.g. `'***4242'`,
		 * to check the right value was given, in logs and error messages.
		 * Only for long random values (e.g. API keys), not for passwords.
		 * Values shorter than 4 times this number are fully masked.
		 */
		reveal?: number
	}

	/**
	 * Decorator of an environment class, or of one of its properties.
	 * @public
	 */
	export type Decorator = {
		(target: Function & { prototype: Environment }): void
		(target: object, propertyKey: string | symbol, descriptor?: undefined): void
	}
}

/**
 * Removes sensitive variables from `process.env` once the environment is loaded from it,
 * so they are not inherited by child processes, nor dumped in logs. Subclasses inherit it.
 *
 * @example
 * ```ts
 * ＠UnsetSensitive()
 * class Env extends Environment {
 *   ＠Sensitive() ＠Var.Str() API_TOKEN!: string
 * }
 * ```
 * ---
 * @public
 */
export function UnsetSensitive(): (target: Function & { prototype: Environment }) => void {
	return (target) =>
		classOrProperty('UnsetSensitive', target, undefined, (options) => {
			if (options.unsetSensitive) return false
			options.unsetSensitive = true
			return true
		})
}
