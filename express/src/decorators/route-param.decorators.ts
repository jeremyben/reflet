import Meta from './metadata-keys'
import { ClassType, Request, Response, NextFunction } from '../interfaces'

enum RouteParam {
	Request,
	Response,
	Next,
	Body,
	Query,
	Param,
	Headers,
	Session,
}

type RouteParamMeta = {
	index: number
	type: RouteParam
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

/**
 * {@inheritDoc (Req:1)}
 */
export function Req(): ParameterDecorator

export function Req() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(RouteParam.Request) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(RouteParam.Request)
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

/**
 * {@inheritDoc (Res:1)}
 */
export function Res(): ParameterDecorator

export function Res() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(RouteParam.Response) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(RouteParam.Response)
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

/**
 * {@inheritDoc (Next:1)}
 */
export function Next(): ParameterDecorator

export function Next() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (defineRouteParamMeta(RouteParam.Next) as Function)(...arguments)
	} else {
		return defineRouteParamMeta(RouteParam.Next)
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

/**
 * {@inheritDoc (Body:1)}
 */
export function Body<T = object>(subKey?: keyof T): ParameterDecorator

export function Body<T = object>(
	subKeyOrTarget?: keyof T | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(RouteParam.Body, undefined)(subKeyOrTarget, propertyKey!, parameterIndex!)
	} else {
		return defineRouteParamMeta(RouteParam.Body, subKeyOrTarget as string | undefined)
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

/**
 * {@inheritDoc (Params:1)}
 */
export function Params(subKey?: string): ParameterDecorator

export function Params(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(RouteParam.Param, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(RouteParam.Param, subKeyOrTarget as string | undefined)
	}
}

/**
 * @see https://expressjs.com/en/4x/api.html#req.query
 *
 * @decorator
 * @public
 */
export function Query(...args: Parameters<ParameterDecorator>): void

/**
 * {@inheritDoc (Query:1)}
 */
export function Query(subKey?: string): ParameterDecorator

export function Query(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(RouteParam.Query, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(RouteParam.Query, subKeyOrTarget as string | undefined)
	}
}

/**
 * @decorator
 * @public
 */
export function Headers(...args: Parameters<ParameterDecorator>): void

/**
 * {@inheritDoc (Headers:1)}
 */
export function Headers(subKey?: string): ParameterDecorator

export function Headers(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		return defineRouteParamMeta(RouteParam.Headers, undefined)(
			subKeyOrTarget,
			propertyKey!,
			parameterIndex!
		)
	} else {
		return defineRouteParamMeta(RouteParam.Headers, subKeyOrTarget as string | undefined)
	}
}

/**
 * @internal
 */
function defineRouteParamMeta(type: RouteParam, subKey?: string): ParameterDecorator {
	return (target, methodKey, index) => {
		const params: RouteParamMeta[] = Reflect.getOwnMetadata(Meta.RouteParams, target, methodKey) || []
		params.push({ index, type, subKey })
		Reflect.defineMetadata(Meta.RouteParams, params, target, methodKey)
	}
}

/**
 * Intercepts a decorated handler execution and extract the Request, Response, Next arguments, and the Request properties.
 * @internal
 */
export function extractRouteParams(
	target: ClassType,
	methodKey: string | symbol,
	{ req, res, next }: { req: Request; res: Response; next: NextFunction }
): any[] {
	const params: RouteParamMeta[] | undefined = Reflect.getOwnMetadata(
		Meta.RouteParams,
		target.prototype,
		methodKey
	)

	// No decorator found in the method: simply return the original arguments in the original order
	if (!params || !params.length) return [req, res, next]

	const args: any[] = []

	for (const { type, index, subKey } of params) {
		switch (type) {
			case RouteParam.Request:
				args[index] = req
				break
			case RouteParam.Response:
				args[index] = res
				break
			case RouteParam.Next:
				args[index] = next
				break
			case RouteParam.Body:
				args[index] = subKey ? req.body[subKey] : req.body
				break
			case RouteParam.Param:
				args[index] = subKey ? req.params[subKey] : req.params
				break
			case RouteParam.Query:
				args[index] = subKey ? req.query[subKey] : req.query
				break
			case RouteParam.Headers:
				args[index] = subKey ? req.headers[subKey] : req.headers
				break
			default:
				throw Error('Route parameter type not recognized')
		}
	}

	return args
}

/**
 * Checks that the given route use the `@Body` decorator, so we know we must apply the body-parser middleware.
 * @internal
 */
export function hasBodyParam(target: ClassType, methodKey: string | symbol): boolean {
	const params: RouteParamMeta[] | undefined = Reflect.getOwnMetadata(
		Meta.RouteParams,
		target.prototype,
		methodKey
	)

	if (!params) return false

	return params.some((param) => param.type === RouteParam.Body)
}
