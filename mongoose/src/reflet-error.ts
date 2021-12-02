/**
 * Dedicated Reflet Error.
 * @internal
 */
export class RefletMongooseError extends Error {
	code:
		| 'MISSING_ROOT_MODEL'
		| 'INVALID_DECORATORS_ORDER'
		| 'EMPTY_DISCRIMINATOR_KEY'
		| 'DISCRIMINATOR_KEY_CONFLICT'
		| 'TIMESTAMP_OPTION_CONFLICT'
		| 'VERSIONKEY_OPTION_CONFLICT'
		| 'SCHEMA_CALLBACK_MISSING_MODIFIER'
		| 'SCHEMA_OPTIONS_MISSING_MODIFIER'
		| 'INVALID_FIELD_TYPE'

	constructor(code: RefletMongooseError['code'], message: string) {
		super(message)
		this.code = code
		Object.defineProperty(this, 'name', { value: 'RefletMongooseError', configurable: true })

		Error.captureStackTrace(this, RefletMongooseError)
	}
}
