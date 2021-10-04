/**
 * Dedicated Reflet Error.
 * @public
 */
export class RefletExpressError extends Error {
	code:
		| 'ROUTER_DECORATOR_MISSING'
		| 'DYNAMIC_ROUTER_PATH_UNDEFINED'
		| 'ROUTER_PATH_CONSTRAINED'
		| 'EXPRESS_PROPERTY_PROTECTED'
		| 'MULTIPLE_PARAMETER_DECORATORS'
		| 'INVALID_ROUTE_TYPE'
		| 'INVALID_EXPRESS_APP'

	constructor(code: RefletExpressError['code'], message: string) {
		super(message)
		this.code = code

		Error.captureStackTrace(this, RefletExpressError)
	}
}
