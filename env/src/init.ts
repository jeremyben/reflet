import { readFileSync } from 'fs'
import { basename, join } from 'path'
import { inspect, InspectOptions } from 'util'
import {
	extractCrossChecks,
	extractGroups,
	extractModifiedKeys,
	extractSecretsDirs,
	extractSensitive,
	extractUnsetSensitive,
} from './env-decorators'
import type { SensitiveOptions } from './env-decorators'
import { extractSpecs } from './var-decorators'
import { initializing } from './default'
import type { ClassType, EnvErrorEntry, EnvSource, Spec } from './interfaces'

/**
 * Aggregated validation error thrown by `Environment.load` when one or more env
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
 * Validates the given source against a decorated class, and returns a frozen instance
 * of that class with the parsed values assigned to its properties.
 * @internal
 */
export function initEnv<T>(target: ClassType<T>, source: EnvSource = process.env): T {
	const instance: any = initializing(source, () => new target())
	const specs = extractSpecs(target)
	const errors: EnvErrorEntry[] = []

	for (const key of extractModifiedKeys(target)) {
		if (!specs.has(key)) {
			throw new Error(`"${target.name}.${String(key)}" has @Sensitive or @Secrets, but no variable decorator.`)
		}
	}
	const sensitive = new Map<string | symbol, SensitiveOptions>()
	for (const key of specs.keys()) {
		const options = extractSensitive(target, key)
		if (options) sensitive.set(key, options)
	}

	// Property initializers (e.g. `PORT = 3000`) are default values.
	const initializers = new Map<string | symbol, unknown>()

	const envNames = (key: string | symbol): readonly string[] => {
		const name = specs.get(key)!.name ?? String(key)
		return typeof name === 'string' ? [name] : name
	}

	for (const key of specs.keys()) {
		// Bare declarations are also defined as `undefined` with `useDefineForClassFields` (ES2022+ targets).
		// `null` is not a default either.
		if (instance[key] != null) {
			initializers.set(key, instance[key])
			// Until processed, a variable reads as `undefined` (from a predicate), not as its unvalidated default.
			// Not deleted, to keep the property position.
			instance[key] = undefined
		}
	}

	// Variable names actually read, among several names or secret files.
	const usedNames = new Map<string | symbol, string>()
	const failed = new Set<string | symbol>()

	// Variables of groups must be optional, or have a default, to be checked by their rules.
	const groups = extractGroups(target)
	for (const { rule, keys, flag } of groups) {
		for (const key of flag ? [flag, ...keys] : keys) {
			if (!specs.has(key))
				throw new Error(`"${target.name}.${key}" is in @Group.${rule}, but has no variable decorator.`)
		}
		for (const key of keys) {
			if (!specs.get(key)!.optional && !initializers.has(key)) {
				throw new Error(
					`"${target.name}.${key}" is in @Group.${rule}, so it must be optional or have a default value.`
				)
			}
		}
	}

	const processKey = (key: string | symbol) => {
		const spec = specs.get(key)!
		// Defined by `Secrets` on the property, or on the class or its closest ancestor.
		const secretsDirs = extractSecretsDirs(target, key)
		const names = envNames(key)
		const read = (envName: string) =>
			Object.prototype.hasOwnProperty.call(source, envName) ? source[envName] : undefined

		// With several names, the first one set is used. Environment variables take precedence over secret files.
		let name = names.find((envName) => !isMissing(spec, read(envName))) ?? names[0]
		let raw = read(name)
		const secret = isMissing(spec, raw)
			? readSecret(names, secretsDirs, (value) => isMissing(spec, value))
			: undefined

		const got = (value: unknown) => {
			const sensitiveOptions = sensitive.get(key)
			if (sensitiveOptions?.reveal) return ` (got "${mask(value, sensitiveOptions.reveal)}")`
			if (sensitiveOptions || secret) return ''
			try {
				// Credentials of URLs are masked, even if not sensitive.
				const shown = spec.type === 'url' && typeof value === 'string' ? redactUrl(value) : value
				const text = JSON.stringify(shown)
				return text === undefined ? '' : ` (got ${text})` // e.g. a function default.
			} catch {
				return '' // e.g. BigInt or circular JSON default.
			}
		}
		usedNames.set(key, name)
		const fail = (kind: EnvErrorEntry['kind'], message: string) => {
			failed.add(key)
			errors.push({ name, kind, message, desc: spec.desc, example: spec.example, docs: spec.docs })
		}

		if (secret) {
			name = secret.name
			usedNames.set(key, name)
			if ('error' in secret) {
				return fail('invalid', `cannot read secret file "${secret.path}": ${errorMessage(secret.error)}`)
			}
			raw = secret.value
		}

		let value: unknown

		if (isMissing(spec, raw)) {
			value = initializers.get(key)

			if (value === undefined) {
				// Left undefined, unless required by a group.
				if (spec.optional) return
				const looked = [
					names.length > 1 ? names.join(', ') : '',
					secretsDirs.length ? `secret files in ${secretsDirs.join(', ')}` : '',
				].filter(Boolean)
				return fail('missing', `missing required value${looked.length ? ` (${looked.join(', ')})` : ''}`)
			}

			try {
				// Defaults are already typed: validated, not coerced.
				// JSON and list defaults are copied by validation, so the frozen value is not the caller's object.
				value = spec.validate(value, name)
			} catch (err) {
				return fail('invalid', `invalid default value: ${errorMessage(err)}${got(value)}`)
			}
		} else {
			try {
				value = spec.validate(spec.coerce(raw, name), name)
			} catch (err) {
				return fail('invalid', errorMessage(err) + got(raw))
			}
		}

		if (spec.choices && !spec.choices.includes(value)) {
			return fail('invalid', `must be one of [${spec.choices.join(', ')}]${got(value)}`)
		}

		// JSON and lists are frozen as well, as the env instance.
		instance[key] = FROZEN_TYPES.includes(spec.type) ? deepFreeze(value) : value
	}

	for (const key of specs.keys()) processKey(key)

	// Presence rules of groups, unless one of their variables is invalid.
	const nameOf = (key: string) => usedNames.get(key) ?? envNames(key)[0]
	const isSet = (key: string) => instance[key] !== undefined
	const report = (key: string, kind: EnvErrorEntry['kind'], message: string) => {
		const { desc, example, docs } = specs.get(key)!
		errors.push({ name: nameOf(key), kind, message, desc, example, docs })
	}
	for (const { rule, keys, flag } of groups) {
		if ([...keys, ...(flag ? [flag] : [])].some((key) => failed.has(key))) continue
		const set = keys.filter(isSet)
		const names = keys.map(nameOf).join(', ')

		if (rule === 'AllOrNone' && set.length && set.length < keys.length) {
			for (const key of keys.filter((k) => !isSet(k))) {
				report(key, 'missing', `required together with ${set.map(nameOf).join(', ')}`)
			}
		} else if ((rule === 'OneOf' || rule === 'AnyOf') && !set.length) {
			report(keys[0], 'missing', `${rule === 'OneOf' ? 'one' : 'at least one'} of ${names} is required`)
		} else if (rule === 'OneOf' && set.length > 1) {
			for (const key of set.slice(1)) report(key, 'invalid', `only one of ${names} can be set`)
		} else if (rule === 'RequiredWhen' && instance[flag!] === true) {
			for (const key of keys.filter((k) => !isSet(k))) report(key, 'missing', `required when ${nameOf(flag!)}`)
		}
	}

	if (errors.length) throw new EnvValidationError(errors)

	// Checked once all variables are valid, and frozen so checks can't change them.
	Object.freeze(instance)
	for (const check of extractCrossChecks(target)) {
		try {
			const result: unknown = check(instance, (key, message) => {
				const spec = specs.get(key)
				const name = usedNames.get(key) ?? (spec ? envNames(key)[0] : String(key))
				errors.push({
					name,
					kind: 'invalid',
					message,
					desc: spec?.desc,
					example: spec?.example,
					docs: spec?.docs,
				})
			})
			// An async check would fail too late, after the environment is used.
			if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
				Promise.resolve(result).catch(() => undefined)
				throw new Error('must be synchronous')
			}
		} catch (err) {
			errors.push({ name: target.name, kind: 'invalid', message: `cross check failed: ${errorMessage(err)}` })
		}
	}
	if (errors.length) throw new EnvValidationError(errors)

	// Only from process.env: an explicit source, e.g. in tests, is left untouched.
	if (source === process.env && extractUnsetSensitive(target)) {
		for (const key of sensitive.keys()) {
			for (const name of envNames(key)) delete process.env[name]
		}
	}

	return instance
}

const UNTRIMMED_TYPES = ['str', 'custom']

/**
 * Masks the password of a URL, e.g. `postgres://user:***@db/app`.
 */
function redactUrl(value: string): string {
	return value.replace(/^([a-z][a-z0-9+.-]*:\/\/[^/?#@:]*:)[^/?#@]*@/i, '$1***@')
}

const FROZEN_TYPES = ['json', 'list']

/**
 * Whitespace-only values are missing as well, for types that trim them.
 */
function isMissing(spec: Spec<any>, raw: string | undefined): raw is undefined {
	if (raw === undefined) return true
	if (spec.allowEmpty) return false
	// A list of separators only has no items.
	if (spec.type === 'list') return raw.split(spec.separator ?? ',').every((item) => item.trim() === '')
	return UNTRIMMED_TYPES.includes(spec.type) ? raw === '' : raw.trim() === ''
}

/**
 * Reads the first non-empty secret file named like one of the variable names, a single trailing newline removed.
 */
function readSecret(
	names: readonly string[],
	dirs: readonly string[],
	isEmpty: (value: string) => boolean
): { name: string; path: string; value: string } | { name: string; path: string; error: unknown } | undefined {
	for (const name of names) {
		// Not a file name.
		if (basename(name) !== name) continue

		for (const dir of dirs) {
			const path = join(dir, name)
			try {
				const value = readFileSync(path, 'utf8').replace(/\r?\n$/, '')
				if (!isEmpty(value)) return { name, path, value }
			} catch (error: any) {
				if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) continue
				return { name, path, error }
			}
		}
	}
	return undefined
}

/**
 * Own properties of an env instance, with sensitive variables masked.
 */
function masked(env: object): Record<string, unknown> {
	const target = env.constructor as ClassType
	const specs = extractSpecs(target)
	const result: Record<string, unknown> = {}
	for (const key of Object.keys(env)) {
		const sensitive = specs.has(key) ? extractSensitive(target, key) : undefined
		result[key] = sensitive ? mask((env as any)[key], sensitive.reveal) : (env as any)[key]
	}
	return result
}

/**
 * Masks a sensitive value, with its last characters revealed if long enough (strings and bytes only).
 */
function mask(value: unknown, reveal?: number): unknown {
	// An unset optional variable is not masked, so it does not look set.
	if (value == null) return value
	const shown = typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('hex') : undefined
	if (!reveal || shown === undefined || shown.length < reveal * 4) return '***'
	return `***${shown.slice(-reveal)}`
}

function deepFreeze<T>(value: T): T {
	// Buffers and other typed arrays can't be frozen.
	if (value && typeof value === 'object' && !Object.isFrozen(value) && !ArrayBuffer.isView(value)) {
		Object.freeze(value)
		for (const child of Object.values(value)) deepFreeze(child)
	}
	return value
}

// Not `instanceof Error`, which fails for errors from another realm (e.g. Node.js internals in a VM context).
const errorMessage = (err: any) => (err && typeof err.message === 'string' ? (err.message as string) : String(err))

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
	static load<T extends Environment>(this: { prototype: T }, source?: EnvSource): T {
		if ((this as unknown) === Environment) {
			throw new Error('`load` must be called on a class extending `Environment`.')
		}
		return initEnv(this as unknown as ClassType<T>, source)
	}

	protected constructor() {}

	/**
	 * Used by `JSON.stringify`: sensitive variables are masked.
	 */
	toJSON(): Record<string, unknown> {
		return masked(this)
	}

	/**
	 * Used by `console.log` and `util.inspect`: sensitive variables are masked.
	 */
	[inspect.custom](depth: number, options: InspectOptions): string {
		return `${this.constructor.name} ${inspect(masked(this), options)}`
	}
}
