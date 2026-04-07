import type { Parser } from './interfaces'

/* istanbul ignore file */

export const parseStr: Parser<string> = (raw, name) => {
	if (typeof raw !== 'string') throw new Error(`"${name}" must be a string`)
	return raw
}

export const parseNum: Parser<number> = (raw, name) => {
	const n = Number(raw)
	if (Number.isNaN(n)) throw new Error(`"${name}" must be a number (got "${raw}")`)
	return n
}

export const parseBool: Parser<boolean> = (raw, name) => {
	const v = raw.toLowerCase()
	if (v === 'true' || v === '1' || v === 'yes') return true
	if (v === 'false' || v === '0' || v === 'no') return false
	throw new Error(`"${name}" must be a boolean (got "${raw}")`)
}

export const parsePort: Parser<number> = (raw, name) => {
	const n = parseNum(raw, name)
	if (!Number.isInteger(n) || n < 1 || n > 65535) {
		throw new Error(`"${name}" must be a valid port number (1-65535)`)
	}
	return n
}

export const parseUrl: Parser<string> = (raw, name) => {
	try {
		// eslint-disable-next-line no-new
		new URL(raw)
	} catch {
		throw new Error(`"${name}" must be a valid URL (got "${raw}")`)
	}
	return raw
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const parseEmail: Parser<string> = (raw, name) => {
	if (!EMAIL_RE.test(raw)) throw new Error(`"${name}" must be a valid email (got "${raw}")`)
	return raw
}

const HOST_RE = /^([a-zA-Z0-9_.-]+|\[[0-9a-fA-F:]+\])$/

export const parseHost: Parser<string> = (raw, name) => {
	if (!HOST_RE.test(raw)) throw new Error(`"${name}" must be a valid hostname or IP (got "${raw}")`)
	return raw
}

export const parseJson: Parser<unknown> = (raw, name) => {
	try {
		return JSON.parse(raw)
	} catch (err: any) {
		throw new Error(`"${name}" must be valid JSON: ${err.message}`)
	}
}
