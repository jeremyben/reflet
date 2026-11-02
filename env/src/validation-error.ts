/**
 * Aggregated error thrown by `Environment.load` when variables are missing or invalid.
 *
 * @example
 * ```
 * EnvValidationError: Invalid environment variables:
 *  - PORT (invalid): "PORT" must be a valid port number (1-65535) (got "99999")
 *  - API_KEY (missing): missing required value
 *      desc:    Key of the payment provider
 *      docs:    https://example.com/docs/payments#api-keys
 * ```
 * ---
 * @public
 */
export class EnvValidationError extends Error {
	/** Every missing or invalid variable. */
	readonly errors: EnvValidationError.Entry[]

	constructor(errors: EnvValidationError.Entry[]) {
		const lines: string[] = []
		for (const e of errors) {
			lines.push(` - ${e.name} (${e.kind}): ${e.message}`)
			if (e.desc) lines.push(`     desc:    ${e.desc}`)
			if (e.docs) lines.push(`     docs:    ${e.docs}`)
		}
		super(`Invalid environment variables:\n${lines.join('\n')}`)
		this.name = 'EnvValidationError'
		this.errors = errors
	}

	/** Entries with `kind === 'missing'`. */
	get missing(): EnvValidationError.Entry[] {
		return this.errors.filter((e) => e.kind === 'missing')
	}

	/** Entries with `kind === 'invalid'`. */
	get invalid(): EnvValidationError.Entry[] {
		return this.errors.filter((e) => e.kind === 'invalid')
	}
}

/**
 * @public
 */
export namespace EnvValidationError {
	/**
	 * Missing or invalid variable.
	 * @public
	 */
	export interface Entry {
		/** Variable name actually read (among several names or secret files), or class name for a failed cross check. */
		name: string
		kind: 'missing' | 'invalid'
		message: string
		/** Description of the variable, from the `desc` option. */
		desc?: string
		/** Documentation URL of the variable, from the `docs` option. */
		docs?: string
	}
}
