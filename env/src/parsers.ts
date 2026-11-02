import { accessSync, constants, statSync } from 'fs'
import { isIP, isIPv6 } from 'net'
import { isAbsolute, resolve } from 'path'
import { hasOwn } from './utils'
import type { Parser, TypeSteps } from './interfaces'

/**
 * Coerces then validates a raw string.
 */
export function parseWith<T>({ coerce, validate }: TypeSteps<T>): Parser.Coercer<T> {
	return (raw, name) => validate(coerce(raw, name), name)
}

/**
 * Adds a validation step after the ones of a type.
 */
export function withValidation<T>(steps: TypeSteps<T>, validate: Parser.Validator<T>): TypeSteps<T> {
	return { ...steps, validate: (value, name) => validate(steps.validate(value, name), name) }
}

const trimmed: Parser.Coercer<string> = (raw) => raw.trim()

/** Whitespace-only values are missing, for types that trim them. */
export const blank = (raw: string): boolean => raw.trim() === ''

/** Only empty values are missing, for types that don't trim them. */
export const empty = (raw: string): boolean => raw === ''

const string: Parser.Validator<string> = (value, name) => {
	if (typeof value !== 'string') throw new Error(`"${name}" must be a string`)
	return value
}

export const str: TypeSteps<string> = { coerce: (raw) => raw, validate: string, isEmpty: empty }

const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

export const num: TypeSteps<number> = {
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
	isEmpty: blank,
}

export const bool: TypeSteps<boolean> = {
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
	isEmpty: blank,
	flag: true,
}

export const port: TypeSteps<number> = withValidation(num, (value, name) => {
	if (!Number.isInteger(value) || value < 1 || value > 65535) {
		throw new Error(`"${name}" must be a valid port number (1-65535)`)
	}
	return value
})

// Requiring "scheme://" catches a common mistake like "localhost:3000", which is a valid URL with "localhost:" scheme.
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//

export const url: TypeSteps<string> = {
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
	isEmpty: blank,
}

/**
 * URL with one of the given protocols, e.g. `https` or `postgres`.
 */
export function urlWith(protocols: readonly string[] | undefined): TypeSteps<string> {
	if (!protocols) return url
	// URLs need "scheme://", so protocols without authority (e.g. mailto) would never match.
	if (!protocols.length || protocols.some((protocol) => !/^[a-z][a-z0-9+.-]*:?$/i.test(protocol))) {
		throw new Error(`@Var.Url protocols must be URL schemes, e.g. ['https'], not ${JSON.stringify(protocols)}.`)
	}
	const allowed = protocols.map((protocol) => protocol.replace(/:$/, '').toLowerCase())
	return withValidation(url, (value, name) => {
		const protocol = new URL(value).protocol.slice(0, -1)
		if (!allowed.includes(protocol))
			throw new Error(`"${name}" must be a URL with protocol ${allowed.join(' or ')}`)
		return value
	})
}

// Underscores are not valid in public DNS names, but are common in container service names.
const LABEL = '[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?'
const HOSTNAME_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})*\\.?$`)
const EMAIL_RE = new RegExp(`^[^\\s@]+@${LABEL}(?:\\.${LABEL})+$`)

export const email: TypeSteps<string> = {
	coerce: trimmed,
	validate: (value, name) => {
		if (!EMAIL_RE.test(string(value, name))) throw new Error(`"${name}" must be a valid email`)
		return value
	},
	isEmpty: blank,
}

export const host: TypeSteps<string> = {
	coerce: trimmed,
	validate: (value, name) => {
		string(value, name)
		const bracketed = value.startsWith('[') && value.endsWith(']')

		if (bracketed ? isIPv6(value.slice(1, -1)) : isIP(value)) return value

		// Dotted numbers that are not a valid IPv4 (e.g. 999.0.0.1) are not hostnames either.
		if (!bracketed && !/^[\d.]+$/.test(value) && value.length <= 253 && HOSTNAME_RE.test(value)) return value

		throw new Error(`"${name}" must be a valid hostname or IP`)
	},
	isEmpty: blank,
}

export const json: TypeSteps<unknown> = {
	coerce: (raw, name) => {
		let finite = true
		let value: unknown
		try {
			// Overflowing numbers (e.g. 1e400) would become null once copied.
			value = JSON.parse(raw, (_key, item) => {
				if (typeof item === 'number' && !Number.isFinite(item)) finite = false
				return item
			})
		} catch {
			// Native error messages may quote part of the input, which could be a secret.
			throw new Error(`"${name}" must be valid JSON`)
		}
		if (!finite) throw new Error(`"${name}" must be valid JSON, with finite numbers`)
		return value
	},
	// A copy, so a frozen default is not the caller's object.
	validate: (value, name) => {
		let text: string | undefined
		try {
			text = JSON.stringify(value)
		} catch (err: any) {
			throw new Error(`"${name}" must be serializable to JSON (${err && err.message})`)
		}
		if (text === undefined) throw new Error(`"${name}" must be serializable to JSON`)
		return JSON.parse(text)
	},
	isEmpty: blank,
	freeze: true,
}

/**
 * Bytes encodings, checked strictly since `Buffer.from` silently drops invalid characters.
 */
const BYTES_ENCODINGS: Record<string, RegExp> = {
	hex: /^(?:[0-9a-fA-F]{2})*$/,
	base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
	base64url: /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/,
}

export function bytes(options: BytesOptions): TypeSteps<Buffer> {
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
		isEmpty: blank,
	}
}

/** Units of durations, in milliseconds. */
const DURATION_UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }

/** Units of sizes, in bytes: decimal (`KB` = 1000) or binary (`KiB` = 1024), case insensitive. */
const SIZE_UNITS: Record<string, number> = {
	b: 1,
	kb: 1e3,
	mb: 1e6,
	gb: 1e9,
	tb: 1e12,
	kib: 1024,
	mib: 1024 ** 2,
	gib: 1024 ** 3,
	tib: 1024 ** 4,
}

/**
 * Amount with units, e.g. `1h30m` or `1.5 GB`, converted to a number of the base unit.
 */
function amount(kind: 'duration' | 'size', units: Record<string, number>, options: AmountOptions): TypeSteps<number> {
	const integer = kind === 'size'
	// Size units are case insensitive, duration ones are not (e.g. M would be ambiguous).
	const re = kind === 'size' ? /(\d+(?:\.\d+)?|\.\d+)\s*([a-z]+)\s*/giy : /(\d+(?:\.\d+)?|\.\d+)\s*([a-z]+)\s*/gy
	const expected = `${kind} with units (${Object.keys(units)
		.map((unit) => (kind === 'size' ? unit.toUpperCase().replace('I', 'i') : unit))
		.join(', ')})`
	const decorator = `@Var.${kind === 'size' ? 'Size' : 'Duration'}`

	const convert = (raw: string): number | undefined => {
		const value = raw.trim()
		// A plain number is in bytes for sizes, and only 0 for durations (e.g. to disable a timeout).
		if (/^\d+$/.test(value) && (kind === 'size' || Number(value) === 0)) return Number(value)
		if (!value) return undefined
		re.lastIndex = 0
		// Exact with integers, e.g. 8.2GB is 82 * 1e9 / 10, while 8.2 * 1e9 is 8199999999.999999.
		let numerator = BigInt(0)
		let denominator = BigInt(1)
		const seen = new Set<string>()
		let match: RegExpExecArray | null
		while (re.lastIndex < value.length && (match = re.exec(value))) {
			const name = match[2].toLowerCase()
			// Each unit once, e.g. not 1h1h.
			if (!hasOwn(units, name) || seen.has(name)) return undefined
			seen.add(name)
			const [whole, decimals = ''] = match[1].split('.')
			const scale = BigInt(10) ** BigInt(decimals.length)
			// Sum of fractions, on a common denominator.
			numerator = numerator * scale + BigInt(whole + decimals) * BigInt(units[name]) * denominator
			denominator *= scale
		}
		if (re.lastIndex !== value.length) return undefined
		return numerator % denominator === BigInt(0)
			? Number(numerator / denominator)
			: Number(numerator) / Number(denominator)
	}

	const bound = (limit: number | string | undefined, option: string): number | undefined => {
		const value = typeof limit === 'string' ? convert(limit) : limit
		if (limit !== undefined && (value === undefined || !Number.isFinite(value) || value < 0)) {
			throw new Error(`${decorator} ${option} must be a ${expected}, or a number, positive or zero.`)
		}
		return value
	}
	const min = bound(options.min, 'min')
	const max = bound(options.max, 'max')
	if (min !== undefined && max !== undefined && min > max) throw new Error(`${decorator} min cannot exceed max.`)

	return {
		coerce: (raw, name) => {
			const value = convert(raw)
			if (value === undefined) {
				throw new Error(`"${name}" must be a ${expected}, e.g. ${kind === 'size' ? '10MB' : '30s or 1h30m'}`)
			}
			return value
		},
		validate: (value, name) => {
			if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
				throw new Error(`"${name}" must be a ${kind}, positive or zero`)
			}
			if (integer && !Number.isInteger(value)) throw new Error(`"${name}" must be a whole number of bytes`)
			if (!Number.isSafeInteger(Math.round(value)))
				throw new Error(`"${name}" must be at most ${Number.MAX_SAFE_INTEGER}`)
			if (min !== undefined && value < min) throw new Error(`"${name}" must be at least ${options.min}`)
			if (max !== undefined && value > max) throw new Error(`"${name}" must be at most ${options.max}`)
			return value
		},
		isEmpty: blank,
	}
}

/**
 * Duration in milliseconds, e.g. `500ms`, `30s`, `1h30m` or `1.5d`.
 */
export function duration(options: AmountOptions): TypeSteps<number> {
	return amount('duration', DURATION_UNITS, options)
}

/**
 * Size in bytes, e.g. `512`, `10MB` or `1GiB`.
 */
export function size(options: AmountOptions): TypeSteps<number> {
	return amount('size', SIZE_UNITS, options)
}

/**
 * Existing file or directory, resolved to an absolute path.
 */
export function path(kind: 'file' | 'directory', options: PathOptions): TypeSteps<string> {
	const { base, readable, writable } = options
	const access = [readable && 'readable', writable && 'writable'].filter(Boolean).join(' and ')
	return {
		coerce: trimmed,
		validate: (value, name) => {
			string(value, name)
			// Not expanded by Node.js, unlike shells.
			if (value.startsWith('~')) throw new Error(`"${name}" must be an absolute or relative path, without ~`)
			// As an empty environment value, which is missing.
			if (value === '') throw new Error(`"${name}" must be a path, not empty`)

			// Relative to the base (the current directory by default), absolute paths are kept as is.
			// The path is not repeated in messages, whose value is shown unless sensitive.
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
		isEmpty: blank,
	}
}

/**
 * Items separated by `separator`, surrounding whitespace and empty items removed.
 * Indexes in messages count non-empty items.
 */
export function list<T>(item: TypeSteps<T>, separator: string): TypeSteps<T[]> {
	if (separator === '') throw new Error('@Var.List separator cannot be empty.')
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
		// A list of separators only has no items.
		isEmpty: (raw) => raw.split(separator).every(blank),
		freeze: true,
	}
}

/**
 * Steps of a custom parser.
 */
export function custom(parser: Parser<any>): TypeSteps<any> {
	const identity = (value: any) => value
	if (typeof parser === 'function') return { coerce: parser, validate: identity, isEmpty: empty }
	return { coerce: parser.coerce || identity, validate: parser.validate || identity, isEmpty: empty }
}

interface BytesOptions {
	encoding?: 'utf8' | 'hex' | 'base64' | 'base64url'
	length?: number
	minLength?: number
	maxLength?: number
}

interface AmountOptions {
	min?: number | string
	max?: number | string
}

interface PathOptions {
	base?: string
	readable?: boolean
	writable?: boolean
}
