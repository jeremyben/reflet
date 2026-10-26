import { isIP, isIPv6 } from 'net'
import type { Parser } from './interfaces'

export const parseStr: Parser<string> = (raw) => raw

const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

export const parseNum: Parser<number> = (raw, name) => {
	const trimmed = raw.trim()
	const n = Number(trimmed)
	if (!NUM_RE.test(trimmed) || !Number.isFinite(n)) throw new Error(`"${name}" must be a finite decimal number`)
	return n
}

export const parseBool: Parser<boolean> = (raw, name) => {
	const v = raw.trim().toLowerCase()
	if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
	if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
	throw new Error(`"${name}" must be a boolean (true|false|1|0|yes|no|on|off)`)
}

export const parsePort: Parser<number> = (raw, name) => {
	const n = parseNum(raw, name)
	if (!Number.isInteger(n) || n < 1 || n > 65535) {
		throw new Error(`"${name}" must be a valid port number (1-65535)`)
	}
	return n
}

// Requiring "scheme://" catches a common mistake like "localhost:3000", which is a valid URL with "localhost:" scheme.
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//

export const parseUrl: Parser<string> = (raw, name) => {
	const v = raw.trim()
	try {
		// eslint-disable-next-line no-new
		new URL(v)
	} catch {
		throw new Error(`"${name}" must be a valid URL`)
	}
	if (!URL_SCHEME_RE.test(v)) throw new Error(`"${name}" must be an absolute URL with a scheme (e.g. https://)`)
	return v
}

// Underscores are not valid in public DNS names, but are common in container service names.
const LABEL = '[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?'
const HOSTNAME_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})*\\.?$`)
const EMAIL_RE = new RegExp(`^[^\\s@]+@${LABEL}(?:\\.${LABEL})+$`)

export const parseEmail: Parser<string> = (raw, name) => {
	const v = raw.trim()
	if (!EMAIL_RE.test(v)) throw new Error(`"${name}" must be a valid email`)
	return v
}

export const parseHost: Parser<string> = (raw, name) => {
	const v = raw.trim()
	const bracketed = v.startsWith('[') && v.endsWith(']')

	if (bracketed ? isIPv6(v.slice(1, -1)) : isIP(v)) return v

	// Dotted numbers that are not a valid IPv4 (e.g. 999.0.0.1) are not hostnames either.
	if (!bracketed && !/^[\d.]+$/.test(v) && v.length <= 253 && HOSTNAME_RE.test(v)) return v

	throw new Error(`"${name}" must be a valid hostname or IP`)
}

export const parseJson: Parser<unknown> = (raw, name) => {
	try {
		return JSON.parse(raw)
	} catch {
		// Native error messages may quote part of the input, which could be a secret.
		throw new Error(`"${name}" must be valid JSON`)
	}
}
