import Meta from './metadata-keys'
import { ClassType, Request, Response, NextFunction, RequestHeaderName, RequestHandler } from '../interfaces'
import { json, urlencoded } from 'express'
import { flatMapFast } from '../utils'

type RouteParamMeta = {
	index: number
	mapper: (req: Request, res?: Response, next?: NextFunction) => any
	use?: RequestHandler[]
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
		return createParamDecorator((req) => req.body, bodyParsers)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = subKeyOrTarget as keyof T | undefined
		return createParamDecorator((req) => (subKey ? req.body[subKey] : req.body), bodyParsers)
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
 * @param use - add before middlewares to the route if the mapper needs them (e.g. we need body-parser middlewares to retrieve `req.body` properties)
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
 * const BodyTrimmed = (key) => createParamDecorator((req) => req.body[key].trim(), [express.json()])
 *
 * class Foo {
 * 		@Post('/message')
 * 		createMessage(@BodyTrimmed('text') text: string) {}
 * }
 * ```
 *
 * @public
 */
export function createParamDecorator<T = any>(
	mapper: (req: Request) => T,
	use?: RequestHandler[]
): ParameterDecorator {
	return (target, methodKey, index) => {
		const routeParams: RouteParamMeta[] =
			Reflect.getOwnMetadata(Meta.RouteParams, target, methodKey) || []

		routeParams.push({ index, mapper, use })
		Reflect.defineMetadata(Meta.RouteParams, routeParams, target, methodKey)
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
export function extractRouteParams(
	target: ClassType,
	methodKey: string | symbol,
	{ req, res, next }: { req: Request; res: Response; next: NextFunction }
): any[] {
	const routeParams: RouteParamMeta[] =
		Reflect.getOwnMetadata(Meta.RouteParams, target.prototype, methodKey) || []

	// No decorator found in the method: simply return the original arguments in the original order
	if (!routeParams.length) return [req, res, next]

	const args: any[] = []

	for (const { index, mapper } of routeParams) {
		args[index] = mapper(req, res, next)
	}

	return args
}

/**
 * Retrieve added middlewares to use custom param decorator.
 * Dedupe/remove them if they're already applied in other _before_ middlewares.
 *
 * Extracted separately from the mapper, because middlewares are applied on route registering,
 * and the mapper is applied later inside a closure on route handling.
 *
 * Get methods metadata from the prototype (no need to create an instance).
 *
 * @internal
 */
export function extractRouteParamsMiddlewares(
	target: ClassType,
	methodKey: string | symbol,
	middlewaresAlreadyUsed: RequestHandler[][]
): RequestHandler[] {
	const routeParams: RouteParamMeta[] =
		Reflect.getOwnMetadata(Meta.RouteParams, target.prototype, methodKey) || []

	if (!routeParams.length) return []

	const paramMwares: RequestHandler[] = []

	// Dedupe middlewares by comparing function bodies
	const mwareBodies = flatMapFast(middlewaresAlreadyUsed, (m) => m.toString())

	for (const { use } of routeParams) {
		if (!use) continue

		for (const mware of use) {
			const mwareBody = mware.toString()
			if (mwareBodies.includes(mwareBody)) continue

			paramMwares.push(mware)
			mwareBodies.push(mwareBody) // avoid adding twice the same param middleware
		}
	}

	return paramMwares
}
