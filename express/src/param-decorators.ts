import * as express from 'express'
import * as core from 'express-serve-static-core'
import { RequestHeader } from '@reflet/http'
import { flatMapFast } from './array-manipulation'
import { ClassType } from './interfaces'
import { RefletExpressError } from './reflet-error'

const META = Symbol('param')

/**
 * Injects Request object in the method's parameters.
 * @see https://expressjs.com/en/4x/api.html#req
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Req req: Req) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Req() req: Req) {}
 * ```
 * ------
 * @public
 */
export function Req(): Req.Decorator

export function Req(...args: Parameters<Req.Decorator>): void

export function Req() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (createParamDecorator((req) => req) as Function)(...arguments)
	} else {
		return createParamDecorator((req) => req)
	}
}

export type Req<
	P = core.ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = core.Query,
	Locals extends Record<string, any> = Record<string, any>
> = express.Request<P, ResBody, ReqBody, ReqQuery, Locals>

export namespace Req {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressReq?: never; __expressHandlerParameter?: never }
}

/**
 * Inject Response object in the method's parameters.
 * @see https://expressjs.com/en/4x/api.html#res
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Res res: Res) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Res() res: Res) {}
 * ```
 * ------
 * @public
 */
export function Res(): Res.Decorator

export function Res(...args: Parameters<Res.Decorator>): void

export function Res() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (createParamDecorator((req, res: express.Response) => res) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res: express.Response) => res)
	}
}

export type Res<ResBody = any, Locals extends Record<string, any> = Record<string, any>> = express.Response<
	ResBody,
	Locals
>

export namespace Res {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressRes?: never; __expressHandlerParameter?: never }
}

/**
 * Injects `next` callback function in the method's parameters.
 * @see https://expressjs.com/en/guide/writing-middleware.html
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Next next: Next) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Next() next: Next) {}
 * ```
 * ------
 * @public
 */
export function Next(): Next.Decorator

export function Next(...args: Parameters<Next.Decorator>): void

export function Next() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		// next is not defined in the public method signature, but is still used later
		// by the route params extractor so we must pass it as optional for the compiler
		return (createParamDecorator((req, res, next?: express.NextFunction) => next!) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res, next?: express.NextFunction) => next!)
	}
}

export type Next = express.NextFunction

export namespace Next {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressNext?: never; __expressHandlerParameter?: never }
}

/** default parser middlewares to apply with @Body decorator */
const bodyParsers: createParamDecorator.Middleware[] = [
	{ handler: express.json(), dedupe: true },
	{ handler: express.urlencoded({ extended: true }), dedupe: true },
]

/**
 * Injects request body in the method's parameters.
 * @param key - directly injects a body property.
 * @see https://expressjs.com/en/4x/api.html#req.body
 * @example
 * ```ts
 * // Whole body without invokation:
 * ＠Post('/some')
 * create(＠Body body: object) {}
 *
 * // Whole body with invokation:
 * ＠Put('/some')
 * replace(＠Body() body: object) {}
 *
 * // Sub property:
 * ＠Patch('/some')
 * update(＠Body<User>('email') email: string) {}
 * ```
 * ------
 * @public
 */
export function Body<T extends object>(key?: keyof T): Body.Decorator
// todo: https://codewithstyle.info/Deep-property-access-in-TypeScript/

export function Body(...args: Parameters<Body.Decorator>): void

export function Body<T extends object>(
	keyOrTarget?: keyof T | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof keyOrTarget === 'object') {
		const target = keyOrTarget
		return createParamDecorator((req) => req.body, bodyParsers)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = keyOrTarget as keyof T | undefined
		return createParamDecorator((req) => (subKey ? req.body[subKey] : req.body), bodyParsers)
	}
}

export namespace Body {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressBody?: never; __expressHandlerParameter?: never }
}

/**
 * Injects named route parameters in the method's parameters.
 * @param name - directly injects a single route parameter.
 * @see https://expressjs.com/en/4x/api.html#req.params
 * @example
 * ```ts
 * // Route parameters object without invokation:
 * ＠Get('/:col/:id')
 * get(＠Params params: Params<'col' | 'id'>) {}
 *
 * // Route parameters object with invokation:
 * ＠Get('/:col/:id')
 * get(＠Params() params: Params<'col' | 'id'>) {}
 *
 * // Single route parameter:
 * ＠Get('/:col/:id')
 * get(＠Params('col') col: string, ＠Params('id') id: string) {}
 * ```
 * ------
 * @public
 */
export function Params(name?: string): Params.Decorator

export function Params(...args: Parameters<Params.Decorator>): void

export function Params(nameOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof nameOrTarget === 'object') {
		const target = nameOrTarget
		return createParamDecorator((req) => req.params)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = nameOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.params[subKey] : req.params))
	}
}

export type Params<P extends string = string> = Record<P, string>

export namespace Params {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressParams?: never; __expressHandlerParameter?: never }
}

/**
 * Injects query string parameters in the method's parameters.
 * @param field - directly injects a value.
 * @see https://expressjs.com/en/4x/api.html#req.query
 * @example
 * ```ts
 * // Query string parameters object without invokation:
 * ＠Get('/search')
 * search(＠Query query: Query) {}
 *
 * // Query string parameters object with invokation:
 * ＠Get('/search')
 * search(＠Query() query: Query) {}
 *
 * // Single query string parameter:
 * ＠Get('/search')
 * search(＠Query('name') name: string, ＠Query('sort') sort: string) {}
 * ```
 * ------
 * @public
 */
export function Query(field?: string): Query.Decorator

export function Query(...args: Parameters<Query.Decorator>): void

export function Query(fieldOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof fieldOrTarget === 'object') {
		const target = fieldOrTarget
		return createParamDecorator((req) => req.query)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = fieldOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.query[subKey] : req.query))
	}
}

export type Query = { [key: string]: undefined | string | string[] | Query | Query[] }

export namespace Query {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressQuery?: never; __expressHandlerParameter?: never }
}

/**
 * Injects request headers object in the method's parameters.
 * @param headerName - directly injects a specific header.
 * @see https://nodejs.org/api/http.html#http_message_headers
 * @example
 * ```ts
 * // Request headers object without invokation:
 * ＠Get('/some')
 * get(＠Headers headers: Headers) {}
 *
 * // Request headers object with invokation:
 * ＠Get('/some')
 * get(＠Headers() headers: Headers) {}
 *
 * // Single request header:
 * ＠Get('/some')
 * get(＠Headers('user-agent') userAgent: string) {}
 * ```
 * ------
 * @public
 */
export function Headers(headerName?: RequestHeader): Headers.Decorator

export function Headers(...args: Parameters<Headers.Decorator>): void

export function Headers(nameOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof nameOrTarget === 'object') {
		const target = nameOrTarget
		return createParamDecorator((req) => req.headers)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = nameOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.headers[subKey] : req.headers))
	}
}

export type Headers = RequestHeader.Record

export namespace Headers {
	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressHeaders?: never; __expressHandlerParameter?: never }
}

/**
 * Creates a parameter decorator, to inject anything we want in decorated routes.
 *
 * @param mapper - function that should return the thing we want to inject from the Request object.
 * @param use - adds middlewares to the route if the mapper needs them (_e.g. we need body-parser middlewares to retrieve `req.body`_). You can pass options to deduplicate middlewares based on the handler function reference or name (_e.g. if 'jsonParser' is already in use locally or globally, it won't be added again_).
 *
 * @remarks
 * We can create decorators with or without options.
 * Simple decorators without options are applied without being invoked.
 *
 * ------
 * @example
 * ```ts
 * // Simple decorator:
 * const CurrentUser = createParamDecorator((req) => req.user)
 * class Foo {
 *   ＠Get('/me')
 *   get(＠CurrentUser user: User) {}
 * }
 * ```
 * ------
 * @example
 * ```ts
 * // Advanced decorator (with option and middleware):
 * const BodyTrimmed = (key: string) => createParamDecorator(
 *   (req) => req.body[key].trim(),
 *   [{ handler: express.json(), dedupe: true }]
 * )
 * class Foo {
 *   ＠Post('/message')
 *   create(＠BodyTrimmed('text') text: string) {}
 * }
 * ```
 * ------
 * @public
 */
export function createParamDecorator<T = any>(
	mapper: (req: express.Request, res: express.Response) => T,
	use?: createParamDecorator.Middleware[]
): createParamDecorator.Decorator {
	return (target, key, index) => {
		const params: createParamDecorator.Options[] = Reflect.getOwnMetadata(META, target, key) || []

		if (params[index]) {
			const codePath = `${target.constructor.name}.${key.toString()}`

			throw new RefletExpressError(
				'MULTIPLE_PARAMETER_DECORATORS',
				`Parameter ${index} of "${codePath}" should have a single express decorator.`
			)
		}

		params[index] = { mapper, use }
		Reflect.defineMetadata(META, params, target, key)
	}
}

export namespace createParamDecorator {
	/**
	 * @public
	 */
	export type Options = {
		readonly mapper: (req: express.Request, res: express.Response, next?: express.NextFunction) => any
		readonly use?: Middleware[]
	}

	/**
	 * @public
	 */
	export type Middleware =
		| express.RequestHandler
		| { handler: express.RequestHandler; dedupe?: boolean | 'by-name' | 'by-reference' }

	/**
	 * Equivalent to `ParameterDecorator`.
	 * @public
	 */
	export type Decorator = ParameterDecorator & { __expressHandlerParameter?: never }
}

/**
 * Used to intercept a decorated handler execution and extract the Request, Response, Next,
 * or Request properties, by applying the mapper defined in the metadata.
 *
 * @internal
 */
export function extractParams(
	target: ClassType,
	key: string | symbol,
	{ req, res, next }: { req: express.Request; res: express.Response; next: express.NextFunction }
): any[] {
	const params: createParamDecorator.Options[] = Reflect.getOwnMetadata(META, target.prototype, key) || []

	// No decorator found in the method: simply return the original arguments in the original order
	if (!params.length) return [req, res, next]

	const args: any[] = []

	for (let index = 0; index < params.length; index++) {
		const { mapper } = params[index]
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
 * @internal
 */
export function extractParamsMiddlewares(
	target: ClassType,
	key: string | symbol,
	alreadyMwares: express.RequestHandler[][]
): express.RequestHandler[] {
	const params: createParamDecorator.Options[] = Reflect.getOwnMetadata(META, target.prototype, key) || []
	if (!params.length) return []

	const paramMwares: express.RequestHandler[] = []

	let alreadyNames: string[] = []

	for (const { use } of params) {
		if (!use) continue

		for (const mware of use) {
			if (typeof mware === 'function') {
				// If the same param decorator is used twice, we prevent adding its middlewares twice
				// whether or not it's marked for dedupe, to do that we simply compare by reference.
				if (paramMwares.includes(mware)) {
					continue
				}

				paramMwares.push(mware)
			} else {
				if (paramMwares.includes(mware.handler)) {
					continue
				}

				// Dedupe middlewares in upper layers.

				if (mware.dedupe === true || mware.dedupe === 'by-reference') {
					const sameRef = alreadyMwares.some((alreadyMware) => alreadyMware.includes(mware.handler))
					// console.log('dedupe-by-reference:', mware.handler.name, sameRef)
					if (sameRef) {
						continue
					}
				}

				if (mware.dedupe === true || mware.dedupe === 'by-name') {
					// Perform the flatmap only if one of the parameter requires deduplication by name.
					if (!alreadyNames.length) {
						alreadyNames = flatMapFast(alreadyMwares, (m) => m.name)
					}

					const sameName = !!mware.handler.name && alreadyNames.includes(mware.handler.name)
					// console.log('dedupe-by-name:', mware.handler.name, sameName)
					if (sameName) {
						continue
					}
				}

				paramMwares.push(mware.handler)
			}

			// todo?: alreadyNames.push(mware.name)
			// Should we dedupe by *name* the same middleware on different param decorators ?
			// Or should we just warn the user of a potential conflict, and suggest to move
			// the middleware to an explicit place on the router as an easy fix ?
			// See 'param middlewares deduplication' tests.
		}
	}

	return paramMwares
}
