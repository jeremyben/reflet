import Meta from './metadata-keys'
import { ClassType, RequestHeaderName } from './interfaces'
import { json, urlencoded, Request, Response, NextFunction, RequestHandler } from 'express'
import { flatMapFast } from './utils'

type ParamMeta = {
	index: number
	mapper: (req: Request, res?: Response, next?: NextFunction) => any
	use?: RequestHandler[]
	dedupeUse?: boolean
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
		return (createParamDecorator((req) => req) as Function)(...arguments)
	} else {
		return createParamDecorator((req) => req)
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
		// res is not defined in the public method signature, but is still used later
		// by the route params extractor so we must pass it as optional for the compiler
		return (createParamDecorator((req, res?: Response) => res!) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res?: Response) => res!)
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
		// next is not defined in the public method signature, but is still used later
		// by the route params extractor so we must pass it as optional for the compiler
		return (createParamDecorator((req, res?, next?: NextFunction) => next!) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res?, next?: NextFunction) => next!)
	}
}

/** default parser middlewares to apply with @Body decorator */
const bodyParsers = [json(), urlencoded({ extended: true })]

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
export function Body<T extends object>(subKey?: keyof T): ParameterDecorator

export function Body<T extends object>(
	subKeyOrTarget?: keyof T | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		const target = subKeyOrTarget
		return createParamDecorator((req) => req.body, bodyParsers, true)(
			target,
			propertyKey!,
			parameterIndex!
		)
	} else {
		const subKey = subKeyOrTarget as keyof T | undefined
		return createParamDecorator((req) => (subKey ? req.body[subKey] : req.body), bodyParsers, true)
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
		const target = subKeyOrTarget
		return createParamDecorator((req) => req.params)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = subKeyOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.params[subKey] : req.params))
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
		const target = subKeyOrTarget
		return createParamDecorator((req) => req.query)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = subKeyOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.query[subKey] : req.query))
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
export function Headers<T extends RequestHeaderName | string = RequestHeaderName>(
	subKey?: T extends RequestHeaderName ? RequestHeaderName : string
): ParameterDecorator

export function Headers(
	subKeyOrTarget?: string | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof subKeyOrTarget === 'object') {
		const target = subKeyOrTarget
		return createParamDecorator((req) => req.headers)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = subKeyOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.headers[subKey] : req.headers))
	}
}

/**
 * Create a method parameter decorator, by applying a mapper function to the `Request` object.
 *
 * @param mapper - retrieve and manipulate anything we want from `req`, to use it directly in the decorated method.
 * @param use - add middlewares to the route if the mapper needs them (e.g. we need body-parser middlewares to retrieve `req.body` properties).
 * @param dedupeUse - mark the middlewares for deduplication based on the function reference and name (e.g. if 'jsonParser' is already in use locally or globally, it won't be added again).
 *
 * @remarks
 * We can create decorators with or without options.
 * Simple decorators without options are applied without being invoked.
 *
 * #### Simple decorator:
 * ```ts
 * const CurrentUser = createParamDecorator((req) => req.user)
 *
 * class Foo {
 * 		@Get('/me')
 * 		getUser(@CurrentUser user: User) {}
 * }
 * ```
 *
 * #### Advanced decorator (with option and middleware):
 * ```ts
 * const BodyTrimmed = (key) => createParamDecorator((req) => req.body[key].trim(), [express.json()], true)
 *
 * class Foo {
 * 		@Post('/message')
 * 		createMessage(@BodyTrimmed('text') text: string) {}
 * }
 * ```
 *
 * @decorator
 * @public
 */
export function createParamDecorator<T = any>(
	mapper: (req: Request) => T,
	use?: RequestHandler[],
	dedupeUse?: boolean
): ParameterDecorator {
	return (target, key, index) => {
		const params: ParamMeta[] = Reflect.getOwnMetadata(Meta.Param, target, key) || []

		params.push({ index, mapper, use, dedupeUse })
		Reflect.defineMetadata(Meta.Param, params, target, key)
	}
}

/**
 * Used to intercept a decorated handler execution and extract the Request, Response, Next,
 * or Request properties, by applying the mapper defined in the metadata.
 *
 * Get methods metadata from the prototype (no need to create an instance).
 *
 * @internal
 */
export function extractParams(
	target: ClassType,
	key: string | symbol,
	{ req, res, next }: { req: Request; res: Response; next: NextFunction }
): any[] {
	const params: ParamMeta[] = Reflect.getOwnMetadata(Meta.Param, target.prototype, key) || []

	// No decorator found in the method: simply return the original arguments in the original order
	if (!params.length) return [req, res, next]

	const args: any[] = []

	for (const { index, mapper } of params) {
		args[index] = mapper(req, res, next)
	}

	return args
}

/**
 * Retrieve added middlewares to use custom param decorator.
 *
 * Dedupe/remove middlewares if they're already applied on method or class,
 * by comparing by references and function names (used to compare function bodies,
 * but could not distinguish functions wrapped in a higher order one).
 *
 * Extracted separately from the mapper, because middlewares are applied on route registering,
 * and the mapper is applied later inside a closure on route handling.
 *
 * Get methods metadata from the prototype (no need to create an instance).
 *
 * @internal
 */
export function extractParamsMiddlewares(
	target: ClassType,
	methodKey: string | symbol,
	alreadyMwares: [RequestHandler[], RequestHandler[], RequestHandler[]]
): RequestHandler[] {
	const params: ParamMeta[] = Reflect.getOwnMetadata(Meta.Param, target.prototype, methodKey) || []
	if (!params.length) return []

	const paramMwares: RequestHandler[] = []

	let alreadyNames: string[] = []

	for (const { use, dedupeUse } of params) {
		if (!use) continue

		if (dedupeUse && !alreadyNames.length) {
			alreadyNames = flatMapFast(alreadyMwares, (m) => m.name)
		}

		for (const mware of use) {
			// If the same param decorator is used twice, we prevent adding its middlewares twice
			// whether or not it's marked for dedupe, to do that we simply compare by reference.
			if (paramMwares.includes(mware)) continue

			// dedupe middlewares in upper layers
			if (dedupeUse) {
				const sameRef =
					alreadyMwares[0].includes(mware) ||
					alreadyMwares[1].includes(mware) ||
					alreadyMwares[2].includes(mware)

				const sameName = !!mware.name && alreadyNames.includes(mware.name)

				if (sameRef || sameName) continue
			}

			paramMwares.push(mware)
		}
	}

	return paramMwares
}
