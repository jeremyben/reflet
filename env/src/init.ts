import { extractComputed, extractProps, extractSpec } from './env-decorators'
import type { ClassType, EnvSource } from './interfaces'

/**
 * Aggregated validation error thrown by `initEnv` when one or more env
 * variables are missing or invalid.
 * @public
 */
export class EnvValidationError extends Error {
	readonly errors: { name: string; message: string }[]

	constructor(errors: { name: string; message: string }[]) {
		const summary = errors.map((e) => ` - ${e.name}: ${e.message}`).join('\n')
		super(`Invalid environment variables:\n${summary}`)
		this.name = 'EnvValidationError'
		this.errors = errors
	}
}

/**
 * Validates the given source (defaults to `process.env`) against a decorated
 * class, and returns a typed, frozen instance of that class with the parsed
 * values assigned to its properties.
 *
 * @example
 * ```ts
 * class Env {
 *   ＠Env.Str({ choices: ['development', 'production', 'test'] })
 *   NODE_ENV!: 'development' | 'production' | 'test'
 *
 *   ＠Env.Port({ default: 3000 })
 *   PORT!: number
 * }
 *
 * const env = initEnv(Env)
 * env.PORT // number
 * ```
 * ---
 * @public
 */
export function initEnv<T>(target: ClassType<T>, source: EnvSource = process.env): Readonly<T> {
	const instance = new target()
	const props = extractProps(target)
	const errors: { name: string; message: string }[] = []
	const isProd = (source.NODE_ENV || process.env.NODE_ENV) === 'production'

	const computedKeys: (string | symbol)[] = []

	for (const key of props) {
		const spec = extractSpec(target, key)
		if (!spec) {
			if (extractComputed(target, key)) computedKeys.push(key)
			continue
		}

		const name = spec.name || (key as string)
		const raw = source[name]

		let value: unknown

		if (raw === undefined || raw === '') {
			if (spec.default !== undefined) {
				value = spec.default
			} else if (!isProd && spec.devDefault !== undefined) {
				value = spec.devDefault
			} else {
				errors.push({ name, message: `missing required value${spec.desc ? ` (${spec.desc})` : ''}` })
				continue
			}
		} else {
			try {
				value = spec.parser(raw, name)
			} catch (err: any) {
				errors.push({ name, message: err.message })
				continue
			}
		}

		if (spec.choices && !spec.choices.includes(value as never)) {
			errors.push({
				name,
				message: `must be one of [${spec.choices.join(', ')}] (got ${JSON.stringify(value)})`,
			})
			continue
		}

		;(instance as any)[key] = value
	}

	if (errors.length) throw new EnvValidationError(errors)

	// Resolve computed properties in declaration order so each one can depend on earlier ones.
	for (const key of computedKeys) {
		const fn = extractComputed(target, key)!
		try {
			;(instance as any)[key] = fn(instance as any)
		} catch (err: any) {
			errors.push({ name: key as string, message: err.message })
		}
	}

	if (errors.length) throw new EnvValidationError(errors)

	return Object.freeze(instance)
}

/**
 * Abstract class to extend from, which has a static `init` method.
 *
 * @example
 * ```ts
 * class Env extends EnvInit<typeof Env> {
 *   ＠Env.Port({ default: 3000 })
 *   PORT!: number
 * }
 *
 * const env = Env.init()
 * ```
 * ---
 * @public
 */
export abstract class EnvInit<C extends ClassType> {
	private $typeof?: C

	/** @ts-ignore private */
	static init<T extends EnvInit<any>>(this: ClassType<T>, source?: EnvSource): Readonly<T> {
		return initEnv(this, source)
	}
}
