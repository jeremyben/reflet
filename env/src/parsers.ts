import { accessSync, constants, statSync } from 'fs'
import { isIP, isIPv6 } from 'net'
import { isAbsolute, resolve } from 'path'
import type { Parser, Validator } from './interfaces'

/**
 * Parsing in two steps: coercion of the raw string to the type, then validation of the typed value.
 * Default values (property initializers) are already typed, so they are only validated.
 */
export interface Steps<T> {
	coerce: Parser<T>
	validate: Validator<T>
}

/**
 * Coerces then validates a raw string.
 */
export function parser<T>({ coerce, validate }: Steps<T>): Parser<T> {
	return (raw, name) => validate(coerce(raw, name), name)
}

/**
 * Adds a validation step.
 */
export function refine<T>(steps: Steps<T>, validate: Validator<T>): Steps<T> {
	return { coerce: steps.coerce, validate: (value, name) => validate(steps.validate(value, name), name) }
}

const trimmed: Parser<string> = (raw) => raw.trim()

const string: Validator<string> = (value, name) => {
	if (typeof value !== 'string') throw new Error(`"${name}" must be a string`)
	return value
}

export const str: Steps<string> = { coerce: (raw) => raw, validate: string }

const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

export const num: Steps<number> = {
	coerce: (raw, name) => {
		const value = raw.trim()
		if (!NUM_RE.test(value)) throw new Error(`"${name}" must be a finite decimal number`)
		return Number(value)
	},
	validate: (value, name) => {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new Error(`"${name}" must be a finite decimal number`)
		}
		return value
	},
}

export const bool: Steps<boolean> = {
	coerce: (raw, name) => {
		const v = raw.trim().toLowerCase()
		if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
		if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
		throw new Error(`"${name}" must be a boolean (true|false|1|0|yes|no|on|off)`)
	},
	validate: (value, name) => {
		if (typeof value !== 'boolean') throw new Error(`"${name}" must be a boolean`)
		return value
	},
}

export const port: Steps<number> = refine(num, (value, name) => {
	if (!Number.isInteger(value) || value < 1 || value > 65535) {
		throw new Error(`"${name}" must be a valid port number (1-65535)`)
	}
	return value
})

// Requiring "scheme://" catches a common mistake like "localhost:3000", which is a valid URL with "localhost:" scheme.
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//

export const url: Steps<string> = {
	coerce: trimmed,
	validate: (value, name) => {
		string(value, name)
		try {
			// eslint-disable-next-line no-new
			new URL(value)
		} catch {
			throw new Error(`"${name}" must be a valid URL`)
		}
		if (!URL_SCHEME_RE.test(value)) {
			throw new Error(`"${name}" must be an absolute URL with a scheme (e.g. https://)`)
		}
		return value
	},
}

// Underscores are not valid in public DNS names, but are common in container service names.
const LABEL = '[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?'
const HOSTNAME_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})*\\.?$`)
const EMAIL_RE = new RegExp(`^[^\\s@]+@${LABEL}(?:\\.${LABEL})+$`)

export const email: Steps<string> = {
	coerce: trimmed,
	validate: (value, name) => {
		if (!EMAIL_RE.test(string(value, name))) throw new Error(`"${name}" must be a valid email`)
		return value
	},
}

export const host: Steps<string> = {
	coerce: trimmed,
	validate: (value, name) => {
		string(value, name)
		const bracketed = value.startsWith('[') && value.endsWith(']')

		if (bracketed ? isIPv6(value.slice(1, -1)) : isIP(value)) return value

		// Dotted numbers that are not a valid IPv4 (e.g. 999.0.0.1) are not hostnames either.
		if (!bracketed && !/^[\d.]+$/.test(value) && value.length <= 253 && HOSTNAME_RE.test(value)) return value

		throw new Error(`"${name}" must be a valid hostname or IP`)
	},
}

export const json: Steps<unknown> = {
	coerce: (raw, name) => {
		try {
			return JSON.parse(raw)
		} catch {
			// Native error messages may quote part of the input, which could be a secret.
			throw new Error(`"${name}" must be valid JSON`)
		}
	},
	// A copy, so a frozen default is not the caller's object.
	validate: (value, name) => {
		try {
			return JSON.parse(JSON.stringify(value))
		} catch (err: any) {
			throw new Error(`"${name}" must be serializable to JSON (${err && err.message})`)
		}
	},
}

/**
 * Bytes encodings, checked strictly since `Buffer.from` silently drops invalid characters.
 */
const BYTES_ENCODINGS: Record<string, RegExp> = {
	hex: /^(?:[0-9a-fA-F]{2})*$/,
	base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
	base64url: /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/,
}

export function bytes(options: {
	encoding?: 'utf8' | 'hex' | 'base64' | 'base64url'
	length?: number
	minLength?: number
	maxLength?: number
}): Steps<Buffer> {
	const { encoding = 'utf8', length, minLength, maxLength } = options
	return {
		coerce: (raw, name) => {
			const value = raw.trim()
			const pattern = BYTES_ENCODINGS[encoding]
			if (pattern && !pattern.test(value)) throw new Error(`"${name}" must be valid ${encoding}`)
			// Out of the pool of small buffers, whose memory is shared with unrelated buffers.
			const decoded = Buffer.from(value, encoding)
			const bytes = Buffer.allocUnsafeSlow(decoded.byteLength)
			decoded.copy(bytes)
			decoded.fill(0)
			return bytes
		},
		validate: (value, name) => {
			if (!Buffer.isBuffer(value)) throw new Error(`"${name}" must be a Buffer`)
			if (length !== undefined && value.byteLength !== length)
				throw new Error(`"${name}" must be ${length} bytes`)
			if (minLength !== undefined && value.byteLength < minLength) {
				throw new Error(`"${name}" must be at least ${minLength} bytes`)
			}
			if (maxLength !== undefined && value.byteLength > maxLength) {
				throw new Error(`"${name}" must be at most ${maxLength} bytes`)
			}
			return value
		},
	}
}

/**
 * Existing file or directory, resolved to an absolute path.
 */
export function path(
	kind: 'file' | 'directory',
	options: { base?: string; readable?: boolean; writable?: boolean }
): Steps<string> {
	const { base, readable, writable } = options
	const access = [readable && 'readable', writable && 'writable'].filter(Boolean).join(' and ')
	return {
		coerce: trimmed,
		validate: (value, name) => {
			string(value, name)
			// Not expanded by Node.js, unlike shells.
			if (value.startsWith('~')) throw new Error(`"${name}" must be an absolute or relative path, without ~`)

			// Relative to the base (the current directory by default), absolute paths are kept as is.
			// The path is left out of messages, since it holds the value, which could be sensitive.
			const absolute = resolve(base ?? process.cwd(), value)
			const from = isAbsolute(value) ? '' : ` (relative to ${base ?? 'the current directory'})`
			let stats
			try {
				stats = statSync(absolute)
			} catch (error: any) {
				if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
					throw new Error(`"${name}" must be an existing ${kind}${from}`)
				}
				throw new Error(`"${name}" cannot be accessed${from}${error && error.code ? ` (${error.code})` : ''}`)
			}
			if (kind === 'file' ? !stats.isFile() : !stats.isDirectory()) {
				throw new Error(`"${name}" must be a ${kind}${from}`)
			}
			if (access) {
				// A directory must be searchable as well, to read or create its files.
				const search = kind === 'directory' ? constants.X_OK : 0
				try {
					accessSync(absolute, (readable ? constants.R_OK : 0) | (writable ? constants.W_OK : 0) | search)
				} catch {
					throw new Error(`"${name}" must be a ${access} ${kind}${from}`)
				}
			}
			return absolute
		},
	}
}

/**
 * Items separated by `separator`, surrounding whitespace and empty items removed.
 */
export function list<T>(item: Steps<T>, separator: string): Steps<T[]> {
	return {
		coerce: (raw, name) =>
			raw
				.split(separator)
				.map((value) => value.trim())
				.filter((value) => value !== '')
				.map((value, index) => item.coerce(value, `${name}[${index}]`)),
		// Validated items are a copy.
		validate: (value, name) => {
			if (!Array.isArray(value)) throw new Error(`"${name}" must be an array`)
			return value.map((itemValue, index) => item.validate(itemValue, `${name}[${index}]`))
		},
	}
}
