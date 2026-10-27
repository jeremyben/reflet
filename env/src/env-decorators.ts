import type { Environment } from './init'
import type { ClassType } from './interfaces'

type EnvClass = Function & { prototype: Environment }

/** Options of each class, and of its own properties. */
interface ClassOptions {
	sensitive?: SensitiveOptions
	sensitiveKeys: Map<string | symbol, SensitiveOptions>
	secrets?: readonly string[]
	secretsKeys: Map<string | symbol, readonly string[]>
	unsetSensitive?: boolean
}

const classOptions = new WeakMap<object, ClassOptions>()

function own(target: object): ClassOptions {
	const options = classOptions.get(target) || { sensitiveKeys: new Map(), secretsKeys: new Map() }
	classOptions.set(target, options)
	return options
}

/**
 * Applies a decorator to a class, or to one of its properties.
 */
function classOrProperty(
	decorator: string,
	target: object,
	propertyKey: string | symbol | undefined,
	apply: (options: ClassOptions, propertyKey?: string | symbol) => boolean
): void {
	if (target === undefined || (typeof propertyKey === 'object' && propertyKey !== null)) {
		throw new Error('@reflet/env decorators require the "experimentalDecorators" TypeScript option.')
	}

	const isClass = propertyKey === undefined
	if (!isClass && typeof target === 'function') {
		throw new Error(`"${target.name}.${String(propertyKey)}" cannot be static.`)
	}

	const cls = isClass ? target : target.constructor
	const where = isClass ? `"${(cls as Function).name}"` : `"${(cls as Function).name}.${String(propertyKey)}"`
	if (!apply(own(cls), propertyKey)) throw new Error(`${where} cannot have several @${decorator} decorators.`)
}

/**
 * Class or property decorator.
 * @public
 */
export type ClassOrPropertyDecorator = {
	(target: EnvClass): void
	(target: object, propertyKey: string | symbol, descriptor?: undefined): void
}

/**
 * Marks a variable as sensitive, or every variable when applied to the class:
 * its value is left out of error messages, and masked by `console.log`, `util.inspect` and `JSON.stringify`.
 *
 * @example
 * ```ts
 * class Env extends Environment {
 *   ＠Sensitive()
 *   ＠Var.Url()
 *   DATABASE_URL!: string
 * }
 * ```
 * ---
 * @public
 */
export function Sensitive(sensitiveOptions: SensitiveOptions = {}): ClassOrPropertyDecorator {
	const { reveal } = sensitiveOptions
	if (reveal !== undefined && !(Number.isInteger(reveal) && reveal > 0)) {
		throw new Error(`@Sensitive "reveal" option must be a positive integer.`)
	}

	return ((target: object, propertyKey?: string | symbol) =>
		classOrProperty('Sensitive', target, propertyKey, (options, key) => {
			if (key === undefined) return options.sensitive ? false : !!(options.sensitive = sensitiveOptions)
			if (options.sensitiveKeys.has(key)) return false
			options.sensitiveKeys.set(key, sensitiveOptions)
			return true
		})) as ClassOrPropertyDecorator
}

/**
 * @public
 */
export interface SensitiveOptions {
	/**
	 * Number of last characters to show (of the hexadecimal form for bytes), e.g. `'***4242'`,
	 * to check the right value was given, in logs and error messages.
	 * Only for long random values (e.g. API keys), not for passwords.
	 * Values shorter than 4 times this number are fully masked.
	 */
	reveal?: number
}

/**
 * Reads variables from secret files named like them, in the given directory or directories,
 * e.g. `process.env.CREDENTIALS_DIRECTORY` with systemd, or `/run/secrets` with Docker.
 *
 * - Applied to the class, it concerns every variable. Applied to a property, it overrides the class directories.
 * - Undefined directories are ignored, and environment variables take precedence over secret files.
 * - Subclasses inherit the directories, unless they define their own (none with `＠Secrets([])`).
 *
 * @example
 * ```ts
 * ＠Secrets(process.env.CREDENTIALS_DIRECTORY)
 * class Env extends Environment {
 *   ＠Var.Str() DB_PASSWORD!: string
 *
 *   ＠Secrets([process.env.CREDENTIALS_DIRECTORY, '/run/secrets'])
 *   ＠Var.Str() API_TOKEN!: string
 * }
 * ```
 * ---
 * @public
 */
export function Secrets(dirs: string | undefined | readonly (string | undefined)[]): ClassOrPropertyDecorator {
	const defined = (Array.isArray(dirs) ? (dirs as readonly unknown[]) : [dirs]).filter(
		(dir): dir is string => typeof dir === 'string' && dir !== ''
	)

	return ((target: object, propertyKey?: string | symbol) =>
		classOrProperty('Secrets', target, propertyKey, (options, key) => {
			if (key === undefined) return options.secrets ? false : !!(options.secrets = defined)
			if (options.secretsKeys.has(key)) return false
			options.secretsKeys.set(key, defined)
			return true
		})) as ClassOrPropertyDecorator
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
export function UnsetSensitive(): (target: EnvClass) => void {
	return (target) =>
		classOrProperty('UnsetSensitive', target, undefined, (options) =>
			options.unsetSensitive ? false : (options.unsetSensitive = true)
		)
}

/**
 * Classes of the hierarchy, from the given one up to its ancestors.
 */
function hierarchy(target: ClassType): ClassOptions[] {
	const all: ClassOptions[] = []
	for (let cls = target; cls && cls !== Function.prototype; cls = Object.getPrototypeOf(cls)) {
		const options = classOptions.get(cls)
		if (options) all.push(options)
	}
	return all
}

/**
 * Option of the closest class defining it, on the property first, then on the class itself.
 */
function closest<T>(
	target: ClassType,
	propertyKey: string | symbol,
	property: (options: ClassOptions) => Map<string | symbol, T>,
	cls: (options: ClassOptions) => T | undefined
): T | undefined {
	for (const options of hierarchy(target)) {
		const value = property(options).get(propertyKey) ?? cls(options)
		if (value !== undefined) return value
	}
	return undefined
}

/**
 * @internal
 */
export function extractSensitive(target: ClassType, propertyKey: string | symbol): SensitiveOptions | undefined {
	return closest(
		target,
		propertyKey,
		(o) => o.sensitiveKeys,
		(o) => o.sensitive
	)
}

/**
 * Secret directories of the closest class defining them, on the property first, then on the class itself.
 * @internal
 */
export function extractSecretsDirs(target: ClassType, propertyKey: string | symbol): readonly string[] {
	return (
		closest(
			target,
			propertyKey,
			(o) => o.secretsKeys,
			(o) => o.secrets
		) ?? []
	)
}

/**
 * @internal
 */
export function extractUnsetSensitive(target: ClassType): boolean {
	return hierarchy(target).some((options) => options.unsetSensitive)
}

/**
 * Properties decorated with `Sensitive` or `Secrets` in the hierarchy, to check they are variables.
 * @internal
 */
export function extractModifiedKeys(target: ClassType): Set<string | symbol> {
	const keys = new Set<string | symbol>()
	for (const options of hierarchy(target)) {
		for (const key of options.sensitiveKeys.keys()) keys.add(key)
		for (const key of options.secretsKeys.keys()) keys.add(key)
	}
	return keys
}
