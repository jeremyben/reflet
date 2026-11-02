import { checkModifiedKeys, extractSecretsDirs, extractUnsetSensitive } from './metadata-map'
import { extractSpecs } from './var-decorators'
import { initializing } from './default'
import { readSecret } from './secrets-decorator'
import { checkGroupDefinitions, checkGroups } from './group-decorators'
import { runCrossChecks } from './cross-check-decorator'
import { EnvValidationError } from './validation-error'
import { namesOf, sensitivity, shown } from './mask'
import { deepFreeze, errorMessage, hasOwn } from './utils'
import type { ClassType, Spec } from './interfaces'
import type { Environment } from './environment-class'
import type { Sensitive } from './sensitive-decorators'

/**
 * Validates the given source against a decorated class, and returns a frozen instance
 * of that class with the parsed values assigned to its properties.
 * @internal
 */
export function load<T>(target: ClassType<T>, source: Environment.Source = process.env): T {
	const instance: any = initializing(source, () => new target())
	const specs = extractSpecs(target)
	const errors: EnvValidationError.Entry[] = []

	checkModifiedKeys(target, specs)
	const sensitive = new Map<string | symbol, Sensitive.Options>()
	for (const [key, spec] of specs) {
		const options = sensitivity(target, key, spec)
		if (options) sensitive.set(key, options)
	}

	// Property initializers (e.g. `PORT = 3000`) are default values.
	const defaults = new Map<string | symbol, unknown>()
	for (const key of specs.keys()) {
		// Bare declarations are also defined as `undefined` with `useDefineForClassFields` (ES2022+ targets).
		// `null` is not a default either.
		if (instance[key] != null) {
			defaults.set(key, instance[key])
			// Until processed, a variable reads as `undefined`, not as its unvalidated default.
			// Not deleted, to keep the property position.
			instance[key] = undefined
		}
	}

	const groups = checkGroupDefinitions(target, specs, defaults)

	// Variable names actually read, among several names or secret files.
	const usedNames = new Map<string | symbol, string>()
	const invalid = new Set<string | symbol>()
	const nameOf = (key: string | symbol) =>
		usedNames.get(key) ?? (specs.has(key) ? namesOf(key, specs.get(key)!)[0] : String(key))
	const report = (key: string | symbol, kind: EnvValidationError.Entry['kind'], message: string) => {
		const spec = specs.get(key)
		errors.push({ name: nameOf(key), kind, message, desc: spec?.desc, docs: spec?.docs })
	}

	const read = (name: string) => (hasOwn(source, name) ? source[name] : undefined)
	const isMissing = (spec: Spec<any>, raw: string | undefined): raw is undefined =>
		raw === undefined || (!spec.allowEmpty && spec.isEmpty(raw))

	for (const [key, spec] of specs) {
		const fail = (kind: EnvValidationError.Entry['kind'], message: string) => {
			invalid.add(key)
			report(key, kind, message)
		}
		const names = namesOf(key, spec)
		// Defined by `Secrets` on the property, or on the class or its closest ancestor.
		const secretsDirs = extractSecretsDirs(target, key)

		// With several names, the first one set is used. Environment variables take precedence over secret files.
		let name = names.find((envName) => !isMissing(spec, read(envName))) ?? names[0]
		let raw = read(name)
		const secret = isMissing(spec, raw)
			? readSecret(names, secretsDirs, (value) => isMissing(spec, value))
			: undefined
		const got = (value: unknown) => shown(value, sensitive.get(key), !!secret)

		if (secret) {
			name = secret.name
			if ('error' in secret) {
				usedNames.set(key, name)
				fail('invalid', `cannot read secret file "${secret.path}": ${errorMessage(secret.error)}`)
				continue
			}
			raw = secret.value
		}
		usedNames.set(key, name)

		try {
			if (!isMissing(spec, raw)) {
				instance[key] = validated(spec, spec.coerce(raw, name), name)
			} else if (defaults.has(key)) {
				// Defaults are already typed: validated, not coerced.
				// JSON and list defaults are copied by validation, so the frozen value is not the caller's object.
				const value = defaults.get(key)
				try {
					instance[key] = validated(spec, value, name)
				} catch (err) {
					fail('invalid', `invalid default value: ${errorMessage(err)}${got(value)}`)
					continue
				}
			} else if (!spec.optional) {
				const looked = [
					names.length > 1 ? names.join(', ') : '',
					secretsDirs.length ? `secret files in ${secretsDirs.join(', ')}` : '',
				].filter(Boolean)
				fail('missing', `missing required value${looked.length ? ` (${looked.join(', ')})` : ''}`)
			}
		} catch (err) {
			fail('invalid', errorMessage(err) + got(raw))
		}
	}

	checkGroups(groups, instance, invalid, nameOf, report)
	if (errors.length) throw new EnvValidationError(errors)

	// Checked once all variables are valid, and frozen so checks can't change them.
	Object.freeze(instance)
	runCrossChecks(target, instance, (key, message) => report(key, 'invalid', message), errors)
	if (errors.length) throw new EnvValidationError(errors)

	// Only from process.env: an explicit source, e.g. in tests, is left untouched.
	if (source === process.env && extractUnsetSensitive(target)) {
		for (const key of sensitive.keys()) {
			for (const name of namesOf(key, specs.get(key)!)) delete process.env[name]
		}
	}

	return instance
}

/**
 * Validates a value of the type, then checks its choices, then validates it with the `validate` option.
 * Values of some types (e.g. JSON and lists) are deeply frozen, as the environment.
 */
function validated(spec: Spec<any>, value: unknown, name: string): unknown {
	let checked = spec.validate(value, name)
	// e.g. a custom parser without return, while JSON can be null.
	if (checked === undefined) throw new Error(`"${name}" parser must return a value`)
	if (spec.choices && !spec.choices.includes(checked)) {
		throw new Error(`"${name}" must be one of [${spec.choices.join(', ')}]`)
	}
	if (spec.validateOption) {
		checked = spec.validateOption(checked, name)
		if (checked === undefined) throw new Error(`"${name}" validate option must return a value`)
	}
	return spec.freeze ? deepFreeze(checked) : checked
}
