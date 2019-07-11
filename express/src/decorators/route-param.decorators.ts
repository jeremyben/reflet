import META from './metadata-keys'
import { ClassType, Request, Response, NextFunction } from '../interfaces'

enum ROUTEPARAM {
	REQUEST,
	RESPONSE,
	NEXT,
	BODY,
	QUERY,
	PARAM,
	HEADERS,
	SESSION,
}

type RouteParamMeta = {
	index: number
	type: ROUTEPARAM
	subKey?: string
}

/**
 * @remarks
 * Can be used with or without invokation:
 * ```ts
 * class Foo {
 * 		get(@Req req: Request) {}
 *
 * 		get(@Req() req: Request) {}
 * }
 * ```
 *
 * @see https://expressjs.com/en/4x/api.html#req
 *
 * @decorator
 * @public
 */
export function Req(...args: Parameters<ParameterDecorator>): void
export function Req(): ParameterDecorator
export function Req() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(ROUTEPARAM.REQUEST) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.REQUEST)
	}
}

/**
 * @remarks
 * Can be used with or without invokation:
 * ```ts
 * class Foo {
 * 		get(@Res res: Response) {}
 *
 * 		get(@Res() res: Response) {}
 * }
 * ```
 *
 * @see https://expressjs.com/en/4x/api.html#res
 *
 * @decorator
 * @public
 */
export function Res(...args: Parameters<ParameterDecorator>): void
export function Res(): ParameterDecorator
export function Res() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(ROUTEPARAM.RESPONSE) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.RESPONSE)
	}
}

/**
 * @remarks
 * Can be used with or without invokation:
 * ```ts
 * class Foo {
 * 		get(@Next next: NextFunction) {}
 *
 * 		get(@Next() next: NextFunction) {}
 * }
 * ```
 *
 * @see https://expressjs.com/en/guide/writing-middleware.html
 *
 * @decorator
 * @public
 */
export function Next(...args: Parameters<ParameterDecorator>): void
export function Next(): ParameterDecorator
export function Next() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(ROUTEPARAM.NEXT) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.NEXT)
	}
}

/**
 * @remarks
 * Can be used with or without invokation, and with the possibility to directly retrieve a sub property:
 * ```ts
 * class Foo {
 * 		post(@Body body: object) {}
 *
 * 		post(@Body() body: object) {}
 *
 * 		post(@Body('email') email: string) {}
 * }
 * ```
 *
 * @see https://expressjs.com/en/4x/api.html#req.body
 *
 * @decorator
 * @public
 */
export function Body(...args: Parameters<ParameterDecorator>): void
export function Body<T = object>(subKey?: keyof T): ParameterDecorator
export function Body<T = object>(
	subKeyOrTarget?: keyof T | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(ROUTEPARAM.BODY, undefined)(subKeyOrTarget, propertyKey!, parameterIndex!)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.BODY, subKeyOrTarget as string | undefined)
	}
}

/**
 * @remarks
 * Can be used with or without invokation, and with the possibility to directly retrieve a single param:
 * ```ts
 * class Foo {
 * 		@Post('/:col/:id')
 * 		post(@Params params: { col: string; id: string }) {}
 *
 * 		@Post('/:col/:id')
 * 		post(@Params() params: { col: string; id: string }) {}
 *
 * 		@Post('/:col/:id')
 * 		post(@Params('col') col: string, @Params('id') id: string) {}
 * }
 * ```
 *
 * @see https://expressjs.com/en/4x/api.html#req.params
 *
 * @decorator
 * @public
 */
export function Params(...args: Parameters<ParameterDecorator>): void
export function Params(subKey?: string): ParameterDecorator
export function Params(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(ROUTEPARAM.PARAM, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.PARAM, subKeyOrTarget as string | undefined)
	}
}

/**
 * @see https://expressjs.com/en/4x/api.html#req.query
 *
 * @decorator
 * @public
 */
export function Query(...args: Parameters<ParameterDecorator>): void
export function Query(subKey?: string): ParameterDecorator
export function Query(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(ROUTEPARAM.QUERY, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.QUERY, subKeyOrTarget as string | undefined)
	}
}

/**
 * @decorator
 * @public
 */
export function Headers(...args: Parameters<ParameterDecorator>): void
export function Headers(subKey?: string): ParameterDecorator
export function Headers(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(ROUTEPARAM.HEADERS, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(ROUTEPARAM.HEADERS, subKeyOrTarget as string | undefined)
	}
}

/**
 * @internal
 */
function defineRouteParamMeta(type: ROUTEPARAM, subKey?: string): ParameterDecorator {
	return (target, methodKey, index) => {
		const params: RouteParamMeta[] = Reflect.getOwnMetadata(META.ROUTEPARAMS, target, methodKey) || []
		params.push({ index, type, subKey })
		Reflect.defineMetadata(META.ROUTEPARAMS, params, target, methodKey)
	}
}

/**
 *
 * @internal
 */
export function extractParams(
	target: ClassType,
	methodKey: string | symbol,
	{ req, res, next }: { req: Request; res: Response; next: NextFunction }
) {
	const params: RouteParamMeta[] | undefined = Reflect.getOwnMetadata(
		META.ROUTEPARAMS,
		target.prototype,
		methodKey
	)

	// No decorator found in the method: simply return the original arguments in the original order
	if (!params || !params.length) return [req, res, next]

	const args: any[] = []

	for (const { type, index, subKey } of params) {
		switch (type) {
			case ROUTEPARAM.REQUEST:
				args[index] = req
				break
			case ROUTEPARAM.RESPONSE:
				args[index] = res
				break
			case ROUTEPARAM.NEXT:
				args[index] = next
				break
			case ROUTEPARAM.BODY:
				args[index] = subKey ? req.body[subKey] : req.body
				break
			case ROUTEPARAM.PARAM:
				args[index] = subKey ? req.params[subKey] : req.params
				break
			case ROUTEPARAM.QUERY:
				args[index] = subKey ? req.query[subKey] : req.query
				break
			case ROUTEPARAM.HEADERS:
				args[index] = subKey ? req.headers[subKey] : req.headers
				break
			default:
				throw Error('Route parameter type not recognized')
		}
	}

	return args
}
