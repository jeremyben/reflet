import { extractSensitive, isPropertySensitive } from './metadata-map'
import { extractSpecs } from './var-decorators'
import type { ClassType, Spec } from './interfaces'
import type { Sensitive } from './sensitive-decorators'

/**
 * Names of a variable.
 * @internal
 */
export function namesOf(key: string | symbol, spec: Spec<any>): readonly string[] {
	const name = spec.name ?? String(key)
	return typeof name === 'string' ? [name] : name
}

/**
 * Sensitivity of a variable. NODE_ENV is never sensitive, since read by libraries: left out of a sensitive class.
 * @internal
 */
export function sensitivity(target: ClassType, key: string | symbol, spec: Spec<any>): Sensitive.Options | undefined {
	const options = extractSensitive(target, key)
	if (!options || !namesOf(key, spec).includes('NODE_ENV')) return options
	if (isPropertySensitive(target, key)) {
		throw new Error(`"${target.name}.${String(key)}" cannot be sensitive, as NODE_ENV is read by libraries.`)
	}
	return undefined
}

/**
 * Masks a sensitive value, with its last characters revealed if long enough (strings and bytes only).
 * @internal
 */
export function mask(value: unknown, reveal?: number): unknown {
	// An unset optional variable is not masked, so it does not look set.
	if (value == null) return value
	const shown = typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('hex') : undefined
	if (!reveal || shown === undefined || shown.length < reveal * 4) return '***'
	return `***${shown.slice(-reveal)}`
}

/**
 * Masks credentials of URLs in a JSON text, e.g. `postgres://***@db/app`.
 * @internal
 */
export function redactUrls(text: string): string {
	// Each JSON string once, up to its last @, since credentials may hold spaces, commas or (escaped) quotes.
	// The scheme separator may be mistyped (e.g. https:/ or https:\\), which is when a value is shown.
	return text.replace(/"(?:[^"\\]|\\.)*"/g, (string) => {
		const at = string.lastIndexOf('@')
		const scheme = /(?<![a-z0-9+.-])[a-z][a-z0-9+.-]*(?::(?:\/|\\\\)*|\/\/)/i.exec(string)
		if (at < 0 || !scheme || scheme.index + scheme[0].length > at) return string
		return `${string.slice(0, scheme.index + scheme[0].length)}***${string.slice(at)}`
	})
}

/**
 * Value shown in error messages, e.g. ` (got "abc")`: masked if sensitive, left out if read from a secret file.
 * @internal
 */
export function shown(value: unknown, sensitive: Sensitive.Options | undefined, secret: boolean): string {
	if (sensitive?.reveal) return ` (got "${mask(value, sensitive.reveal)}")`
	if (sensitive || secret) return ''
	try {
		const text = JSON.stringify(value)
		// Credentials of URLs are masked, even if not sensitive, e.g. a database URL in a string.
		return text === undefined ? '' : ` (got ${redactUrls(text)})` // e.g. a function default.
	} catch {
		return '' // e.g. BigInt or circular JSON default.
	}
}

/**
 * Own properties of an env instance, with sensitive variables masked.
 * @internal
 */
export function masked(env: object): Record<string | symbol, unknown> {
	const target = env.constructor as ClassType
	const specs = extractSpecs(target)
	const result: Record<string | symbol, unknown> = {}
	// Symbol keys as well, as inspected by default.
	for (const key of Reflect.ownKeys(env).filter((k) => Object.prototype.propertyIsEnumerable.call(env, k))) {
		const spec = specs.get(key)
		const sensitive = spec && sensitivity(target, key, spec)
		result[key] = sensitive ? mask((env as any)[key], sensitive.reveal) : (env as any)[key]
	}
	return result
}
