import { readFileSync } from 'fs'
import { basename, join } from 'path'
import { classOrProperty } from './metadata-map'
import type { Environment } from './environment-class'

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
export function Secrets(dirs: string | undefined | readonly (string | undefined)[]): Secrets.Decorator {
	const defined = (Array.isArray(dirs) ? (dirs as readonly unknown[]) : [dirs]).filter(
		(dir): dir is string => typeof dir === 'string' && dir !== ''
	)

	return ((target: object, propertyKey?: string | symbol) =>
		classOrProperty('Secrets', target, propertyKey, (options, key) => {
			if (key === undefined) {
				if (options.secrets) return false
				options.secrets = defined
				return true
			}
			if (options.secretsKeys.has(key)) return false
			options.secretsKeys.set(key, defined)
			return true
		})) as Secrets.Decorator
}

/**
 * @public
 */
export namespace Secrets {
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
 * Secret file read for a variable, or the error reading it.
 * @internal
 */
export type SecretFile = { name: string; path: string; value: string } | { name: string; path: string; error: unknown }

/**
 * Reads the first non-empty secret file named like one of the variable names, a single trailing newline removed.
 * @internal
 */
export function readSecret(
	names: readonly string[],
	dirs: readonly string[],
	isEmpty: (value: string) => boolean
): SecretFile | undefined {
	for (const name of names) {
		// Not a file name.
		if (basename(name) !== name || name === '.' || name === '..') continue

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
