import { ancestry, checkExperimentalDecorators } from './utils'
import type { ClassType, Spec } from './interfaces'
import type { Sensitive } from './sensitive-decorators'
import type { CrossCheck } from './cross-check-decorator'

/** Options of each class, and of its own properties. */
interface ClassOptions {
	sensitive?: Sensitive.Options
	sensitiveKeys: Map<string | symbol, Sensitive.Options>
	secrets?: readonly string[]
	secretsKeys: Map<string | symbol, readonly string[]>
	unsetSensitive?: boolean
	crossChecks: CrossCheck.Check<any>[]
	groups: GroupRule[]
}

/**
 * Presence rule of a group of variables.
 * @internal
 */
export interface GroupRule {
	rule: 'AllOrNone' | 'OneOf' | 'AnyOf' | 'RequiredWhen'
	keys: readonly string[]
	flag?: string
}

const classOptions = new WeakMap<object, ClassOptions>()

function own(target: object): ClassOptions {
	let options = classOptions.get(target)
	if (!options) {
		options = { sensitiveKeys: new Map(), secretsKeys: new Map(), crossChecks: [], groups: [] }
		classOptions.set(target, options)
	}
	return options
}

/**
 * Applies a decorator to a class, or to one of its properties.
 * `apply` returns `false` when the decorator is already applied.
 * @internal
 */
export function classOrProperty(
	decorator: string,
	target: object,
	propertyKey: string | symbol | undefined,
	apply: (options: ClassOptions, propertyKey?: string | symbol) => boolean
): void {
	checkExperimentalDecorators(target, propertyKey)

	const isClass = propertyKey === undefined
	if (!isClass && typeof target === 'function') {
		throw new Error(`"${target.name}.${String(propertyKey)}" cannot be static.`)
	}

	const cls = isClass ? target : target.constructor
	const where = isClass ? `"${(cls as Function).name}"` : `"${(cls as Function).name}.${String(propertyKey)}"`
	if (!apply(own(cls), propertyKey)) throw new Error(`${where} cannot have several @${decorator} decorators.`)
}

/**
 * Options of the classes of the hierarchy, from the given one up to its ancestors.
 */
function hierarchy(target: ClassType): ClassOptions[] {
	return ancestry(target)
		.map((cls) => classOptions.get(cls))
		.filter((options): options is ClassOptions => !!options)
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
export function isPropertySensitive(target: ClassType, propertyKey: string | symbol): boolean {
	return hierarchy(target).some((options) => options.sensitiveKeys.has(propertyKey))
}

/**
 * @internal
 */
export function extractSensitive(target: ClassType, propertyKey: string | symbol): Sensitive.Options | undefined {
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
 * Groups of the hierarchy, parents' first.
 * @internal
 */
export function extractGroups(target: ClassType): GroupRule[] {
	return hierarchy(target)
		.reverse()
		.flatMap((options) => options.groups)
}

/**
 * Cross checks of the hierarchy, parents' first.
 * @internal
 */
export function extractCrossChecks(target: ClassType): CrossCheck.Check<any>[] {
	return hierarchy(target)
		.reverse()
		.flatMap((options) => options.crossChecks)
}

/**
 * Checks that properties decorated with `Sensitive` or `Secrets` in the hierarchy are variables.
 * @internal
 */
export function checkModifiedKeys(target: ClassType, specs: Map<string | symbol, Spec<any>>): void {
	for (const options of hierarchy(target)) {
		for (const key of [...options.sensitiveKeys.keys(), ...options.secretsKeys.keys()]) {
			if (!specs.has(key)) {
				throw new Error(
					`"${target.name}.${String(key)}" has @Sensitive or @Secrets, but no variable decorator.`
				)
			}
		}
	}
}
