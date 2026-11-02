import { classOrProperty, extractGroups } from './metadata-map'
import type { GroupRule } from './metadata-map'
import type { ClassType, Spec } from './interfaces'
import type { Environment } from './environment-class'
import type { EnvValidationError } from './validation-error'

function group(rule: GroupRule, min: number): Group.Decorator<any> {
	if (rule.keys.length < min || new Set(rule.keys).size !== rule.keys.length) {
		throw new Error(`@Group.${rule.rule} needs at least ${min} different properties.`)
	}
	return (target: Function) =>
		classOrProperty(`Group.${rule.rule}`, target, undefined, (options) => {
			// Decorators apply bottom-up, but rules are checked in declaration order.
			options.groups.unshift(rule)
			return true
		})
}

/**
 * Rules on the presence of a group of optional variables, checked when the environment is loaded.
 * Variables of a group must be optional, without default value. Subclasses inherit the rules.
 * ---
 * @public
 */
export namespace Group {
	/**
	 * Variables all set, or none.
	 *
	 * @example
	 * ```ts
	 * ＠Group.AllOrNone('S3_ACCESS_KEY', 'S3_SECRET_KEY')
	 * class Env extends Environment {
	 *   ＠Var.Str({ optional: true }) S3_ACCESS_KEY?: string
	 *   ＠Var.Str({ optional: true }) S3_SECRET_KEY?: string
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function AllOrNone<K extends string>(...keys: K[]): Decorator<K> {
		return group({ rule: 'AllOrNone', keys }, 2)
	}

	/**
	 * Exactly one of the variables set.
	 *
	 * @example
	 * ```ts
	 * ＠Group.OneOf('MONGO_URL', 'MONGO_HOST')
	 * ```
	 * ---
	 * @public
	 */
	export function OneOf<K extends string>(...keys: K[]): Decorator<K> {
		return group({ rule: 'OneOf', keys }, 2)
	}

	/**
	 * At least one of the variables set.
	 *
	 * @example
	 * ```ts
	 * ＠Group.AnyOf('SMTP_URL', 'MAIL_API_KEY')
	 * ```
	 * ---
	 * @public
	 */
	export function AnyOf<K extends string>(...keys: K[]): Decorator<K> {
		return group({ rule: 'AnyOf', keys }, 2)
	}

	/**
	 * Variables required when a boolean variable (the flag) is `true`.
	 *
	 * @example
	 * ```ts
	 * ＠Group.RequiredWhen('SENTRY_ENABLED', ['SENTRY_DSN', 'SENTRY_ENV'])
	 * class Env extends Environment {
	 *   ＠Var.Bool() SENTRY_ENABLED = false
	 *   ＠Var.Url({ optional: true }) SENTRY_DSN?: string
	 *   ＠Var.Str({ optional: true }) SENTRY_ENV?: string
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function RequiredWhen<F extends string, K extends string>(flag: F, keys: readonly K[]): Decorator<K, F> {
		if (keys.includes(flag as string as K)) throw new Error('@Group.RequiredWhen flag cannot be in its group.')
		return group({ rule: 'RequiredWhen', keys, flag }, 1)
	}

	/**
	 * Class decorator of a group, whose properties must be optional, and flag boolean, as checked by types.
	 * @public
	 */
	export type Decorator<K extends string, F extends string = never> = <
		T extends Function & { prototype: Environment }
	>(
		target: T &
			([K] extends [OptionalKeys<T['prototype']>]
				? unknown
				: { 'Group properties must be optional': Exclude<K, OptionalKeys<T['prototype']>> }) &
			([F] extends [BooleanKeys<T['prototype']>] ? unknown : { 'Flag must be a boolean property': F })
	) => void

	/** Properties that can be undefined. */
	type OptionalKeys<P> = { [K in keyof P]-?: undefined extends P[K] ? K : never }[keyof P]

	/** Boolean properties. */
	type BooleanKeys<P> = { [K in keyof P]-?: P[K] extends boolean | undefined ? K : never }[keyof P]
}

/**
 * Checks the variables of groups are optional without default, which would always be set.
 * Defaults picked by environment (e.g. Default.byNodeEnv) are only detected where they apply.
 * @internal
 */
export function checkGroupDefinitions(
	target: ClassType,
	specs: Map<string | symbol, Spec<any>>,
	defaults: Map<string | symbol, unknown>
): GroupRule[] {
	const groups = extractGroups(target)
	for (const { rule, keys, flag } of groups) {
		const where = (key: string) => `"${target.name}.${key}" is in @Group.${rule}`
		for (const key of flag ? [flag, ...keys] : keys) {
			if (!specs.has(key)) throw new Error(`${where(key)}, but has no variable decorator.`)
		}
		for (const key of keys) {
			if (!specs.get(key)!.optional) throw new Error(`${where(key)}, so it must be optional.`)
			if (defaults.has(key)) throw new Error(`${where(key)}, so it cannot have a default value.`)
		}
		if (flag && !specs.get(flag)!.flag) throw new Error(`${where(flag)}, so it must be a Var.Bool flag.`)
	}
	return groups
}

/**
 * Checks the presence rules of groups, unless one of their variables is invalid.
 * @internal
 */
export function checkGroups(
	groups: GroupRule[],
	instance: any,
	invalid: Set<string | symbol>,
	nameOf: (key: string) => string,
	report: (key: string, kind: EnvValidationError.Entry['kind'], message: string) => void
): void {
	const isSet = (key: string) => instance[key] !== undefined

	for (const { rule, keys, flag } of groups) {
		if ([...keys, ...(flag ? [flag] : [])].some((key) => invalid.has(key))) continue
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
}
