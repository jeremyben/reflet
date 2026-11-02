import { classOrProperty, extractCrossChecks } from './metadata-map'
import { errorMessage } from './utils'
import type { ClassType } from './interfaces'
import type { Environment } from './environment-class'
import type { EnvValidationError } from './validation-error'

/**
 * Checks variables against each other, once they are all valid, e.g. to forbid a development value in production.
 * Errors are reported in an `EnvValidationError`. Checks must be synchronous.
 * Several checks can be applied, run in declaration order, and subclasses inherit them.
 *
 * Annotate the parameter with your class, so it is checked against the decorated class.
 *
 * @example
 * ```ts
 * ＠CrossCheck((env: Env, fail) => {
 *   if (env.NODE_ENV === 'production' && env.STRIPE_KEY === 'fake') fail('STRIPE_KEY', 'cannot be fake in production')
 * })
 * class Env extends Environment {
 *   ＠Var.Str({ choices: ['development', 'production', 'test'] })
 *   NODE_ENV!: 'development' | 'production' | 'test'
 *
 *   ＠Var.Str()
 *   STRIPE_KEY = Default.byNodeEnv({ development: 'fake', test: 'fake' })
 * }
 * ```
 * ---
 * @public
 */
export function CrossCheck<C>(check: CrossCheck.Check<C>): (target: Function & { prototype: C & Environment }) => void {
	return (target) =>
		classOrProperty('CrossCheck', target, undefined, (options) => {
			// Decorators apply bottom-up, but checks run in declaration order.
			options.crossChecks.unshift(check)
			return true
		})
}

/**
 * @public
 */
export namespace CrossCheck {
	/**
	 * Checks the variables of a loaded environment, and reports errors with `fail`.
	 * @public
	 */
	export type Check<C> = (env: C, fail: (key: Key<C>, message: string) => void) => void

	/**
	 * Properties and getters of an environment, not its methods.
	 * @public
	 */
	export type Key<C> = { [K in keyof C]: C[K] extends Function ? never : K }[keyof C] & (string | symbol)
}

/**
 * Runs the cross checks of a valid environment, and reports their errors.
 * @internal
 */
export function runCrossChecks(
	target: ClassType,
	instance: object,
	report: (key: string | symbol, message: string) => void,
	errors: EnvValidationError.Entry[]
): void {
	for (const check of extractCrossChecks(target)) {
		let done = false
		try {
			const result: unknown = check(instance, (key, message) => {
				// Not after the check returned, e.g. once an async check resumes.
				if (!done) report(key, message)
			})
			done = true
			// An async check would fail too late, after the environment is used.
			if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
				Promise.resolve(result).catch(() => undefined)
				throw new Error('must be synchronous')
			}
		} catch (err) {
			done = true
			errors.push({ name: target.name, kind: 'invalid', message: `cross check failed: ${errorMessage(err)}` })
		}
	}
}
