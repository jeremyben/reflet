import { extractComputed, extractProps, extractSpec } from './env-decorators'
import type { ClassType, EnvErrorEntry, EnvShortcuts, EnvSource } from './interfaces'

/**
 * Aggregated validation error thrown by `initEnv` when one or more env
 * variables are missing or invalid.
 * @public
 */
export class EnvValidationError extends Error {
	readonly errors: EnvErrorEntry[]

	constructor(errors: EnvErrorEntry[]) {
		const lines: string[] = []
		for (const e of errors) {
			lines.push(` - ${e.name} (${e.kind}): ${e.message}`)
			if (e.desc) lines.push(`     desc:    ${e.desc}`)
			if (e.example) lines.push(`     example: ${e.example}`)
			if (e.docs) lines.push(`     docs:    ${e.docs}`)
		}
		super(`Invalid environment variables:\n${lines.join('\n')}`)
		this.name = 'EnvValidationError'
		this.errors = errors
	}

	/** Entries with `kind === 'missing'`. */
	get missing(): EnvErrorEntry[] {
		return this.errors.filter((e) => e.kind === 'missing')
	}

	/** Entries with `kind === 'invalid'`. */
	get invalid(): EnvErrorEntry[] {
		return this.errors.filter((e) => e.kind === 'invalid')
	}
}

/**
 * Validates the given source (defaults to `process.env`) against a decorated
 * class, and returns a typed, frozen instance of that class with the parsed
 * values assigned to its properties. The result also exposes `isProduction`,
 * `isDev` and `isTest` shortcuts derived from `NODE_ENV`.
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
 * env.PORT          // number
 * env.isProduction  // boolean
 * ```
 * ---
 * @public
 */
export function initEnv<T>(target: ClassType<T>, source: EnvSource = process.env): Readonly<T> & EnvShortcuts {
	const instance = new target()
	const props = extractProps(target)
	const errors: EnvErrorEntry[] = []
	const parsed: Record<string, unknown> = {}
	const nodeEnv = source.NODE_ENV ?? process.env.NODE_ENV
	const isProd = nodeEnv === 'production'
	const isTestEnv = nodeEnv === 'test'

	const computedKeys: (string | symbol)[] = []
	const conditionalKeys: (string | symbol)[] = []

	const processKey = (key: string | symbol) => {
		const spec = extractSpec(target, key)
		if (!spec) return

		const name = spec.name || (key as string)
		const raw = source[name]

		let value: unknown

		if (raw === undefined || raw === '') {
			// Conditional requirement: skip silently if predicate says it's not required.
			// `parsed` is fully populated at this point thanks to the two-pass strategy below.
			if (spec.requiredWhen && !spec.requiredWhen(parsed as any)) {
				return
			}

			if (isTestEnv && spec.testDefault !== undefined) {
				value = spec.testDefault
			} else if (spec.default !== undefined) {
				value = spec.default
			} else if (!isProd && spec.devDefault !== undefined) {
				value = spec.devDefault
			} else {
				errors.push({
					name,
					kind: 'missing',
					message: 'missing required value',
					desc: spec.desc,
					example: spec.example,
					docs: spec.docs,
				})
				return
			}
		} else {
			try {
				value = spec.parser(raw, name)
			} catch (err: any) {
				errors.push({
					name,
					kind: 'invalid',
					message: err.message,
					desc: spec.desc,
					example: spec.example,
					docs: spec.docs,
				})
				return
			}
		}

		if (spec.choices && !spec.choices.includes(value as never)) {
			errors.push({
				name,
				kind: 'invalid',
				message: `must be one of [${spec.choices.join(', ')}] (got ${JSON.stringify(value)})`,
				desc: spec.desc,
				example: spec.example,
				docs: spec.docs,
			})
			return
		}

		;(instance as any)[key] = value
		parsed[key as string] = value
	}

	// Pass 1: every property without `requiredWhen`. Conditional ones are deferred so that
	// their predicate sees a fully-populated env (no Partial type needed at the call site).
	for (const key of props) {
		const spec = extractSpec(target, key)
		if (!spec) {
			if (extractComputed(target, key)) computedKeys.push(key)
			continue
		}
		if (spec.requiredWhen) {
			conditionalKeys.push(key)
			continue
		}
		processKey(key)
	}

	// Pass 2: conditional properties.
	for (const key of conditionalKeys) {
		processKey(key)
	}

	if (errors.length) throw new EnvValidationError(errors)

	// Resolve computed properties in declaration order so each one can depend on earlier ones.
	for (const key of computedKeys) {
		const fn = extractComputed(target, key)!
		try {
			;(instance as any)[key] = fn(instance as any)
		} catch (err: any) {
			errors.push({ name: key as string, kind: 'invalid', message: err.message })
		}
	}

	if (errors.length) throw new EnvValidationError(errors)

	// Inject NODE_ENV shortcuts (non-enumerable so they don't pollute serialization).
	Object.defineProperties(instance, {
		isProduction: { value: nodeEnv === 'production', enumerable: false, writable: false, configurable: false },
		isDev: {
			value: nodeEnv !== 'production' && nodeEnv !== 'test',
			enumerable: false,
			writable: false,
			configurable: false,
		},
		isTest: { value: nodeEnv === 'test', enumerable: false, writable: false, configurable: false },
	})

	return Object.freeze(instance) as Readonly<T> & EnvShortcuts
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
	static init<T extends EnvInit<any>>(this: ClassType<T>, source?: EnvSource): Readonly<T> & EnvShortcuts {
		return initEnv(this, source)
	}
}
