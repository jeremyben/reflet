import * as express from 'express'
import { flatMapFast } from './array-manipulation'
import { ClassType, RequestHeaderName, Decorator } from './interfaces'

const MetaKey = Symbol('param')

/**
 * @internal
 */
type ParamMeta = {
	index: number
	mapper: (req: express.Request, res: express.Response, next?: express.NextFunction) => any
	use?: express.RequestHandler[]
	dedupeUse?: boolean
}

/**
 * Injects Request object in the method's parameters.
 * @see https://expressjs.com/en/4x/api.html#req
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Req req: Request) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Req() req: Request) {}
 * ```
 * ------
 * @public
 */
export function Req(): Decorator.Req

export function Req(...args: Parameters<Decorator.Req>): void

export function Req() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (createParamDecorator((req) => req) as Function)(...arguments)
	} else {
		return createParamDecorator((req) => req)
	}
}

/**
 * Inject Response object in the method's parameters.
 * @see https://expressjs.com/en/4x/api.html#res
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Res res: Response) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Res() res: Response) {}
 * ```
 * ------
 * @public
 */
export function Res(): Decorator.Res

export function Res(...args: Parameters<Decorator.Res>): void

export function Res() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		return (createParamDecorator((req, res: express.Response) => res) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res: express.Response) => res)
	}
}

/**
 * Injects `next` callback function in the method's parameters.
 * @see https://expressjs.com/en/guide/writing-middleware.html
 * @example
 * ```ts
 * // Without invokation:
 * ＠Get('/some')
 * get(＠Next next: NextFunction) {}
 *
 * // With invokation:
 * ＠Post('/some')
 * create(＠Next() next: NextFunction) {}
 * ```
 * ------
 * @public
 */
export function Next(): Decorator.Next

export function Next(...args: Parameters<Decorator.Next>): void

export function Next() {
	if (arguments.length === 3 && typeof arguments[2] === 'number') {
		// next is not defined in the public method signature, but is still used later
		// by the route params extractor so we must pass it as optional for the compiler
		return (createParamDecorator((req, res, next?: express.NextFunction) => next!) as Function)(...arguments)
	} else {
		return createParamDecorator((req, res, next?: express.NextFunction) => next!)
	}
}

/** default parser middlewares to apply with @Body decorator */
const bodyParsers = [express.json(), express.urlencoded({ extended: true })]

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
export function Body<T extends object>(key?: keyof T): Decorator.Body
// todo: https://codewithstyle.info/Deep-property-access-in-TypeScript/

export function Body(...args: Parameters<Decorator.Body>): void

export function Body<T extends object>(
	keyOrTarget?: keyof T | object,
	propertyKey?: string | symbol,
	parameterIndex?: number
) {
	if (arguments.length === 3 && typeof keyOrTarget === 'object') {
		const target = keyOrTarget
		return createParamDecorator((req) => req.body, bodyParsers, true)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = keyOrTarget as keyof T | undefined
		return createParamDecorator((req) => (subKey ? req.body[subKey] : req.body), bodyParsers, true)
	}
}

/**
 * Injects named route parameters in the method's parameters.
 * @param name - directly injects a single route parameter.
 * @see https://expressjs.com/en/4x/api.html#req.params
 * @example
 * ```ts
 * // Route parameters object without invokation:
 * ＠Get('/:col/:id')
 * get(＠Params params: { col: string; id: string }) {}
 *
 * // Route parameters object with invokation:
 * ＠Get('/:col/:id')
 * get(＠Params() params: { col: string; id: string }) {}
 *
 * // Single route parameter:
 * ＠Get('/:col/:id')
 * get(＠Params('col') col: string, ＠Params('id') id: string) {}
 * ```
 * ------
 * @public
 */
export function Params(name?: string): Decorator.Params

export function Params(...args: Parameters<Decorator.Params>): void

export function Params(nameOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof nameOrTarget === 'object') {
		const target = nameOrTarget
		return createParamDecorator((req) => req.params)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = nameOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.params[subKey] : req.params))
	}
}

/**
 * Injects query string parameters in the method's parameters.
 * @param field - directly injects a value.
 * @see https://expressjs.com/en/4x/api.html#req.query
 * @example
 * ```ts
 * // Query string parameters object without invokation:
 * ＠Get('/search')
 * search(＠Query queries: any) {}
 *
 * // Query string parameters object with invokation:
 * ＠Get('/search')
 * search(＠Query() queries: any) {}
 *
 * // Single query string parameter:
 * ＠Get('/search')
 * search(＠Query('name') name: string, ＠Query('sort') sort: string) {}
 * ```
 * ------
 * @public
 */
export function Query(field?: string): Decorator.Query

export function Query(...args: Parameters<Decorator.Query>): void

export function Query(fieldOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof fieldOrTarget === 'object') {
		const target = fieldOrTarget
		return createParamDecorator((req) => req.query)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = fieldOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.query[subKey] : req.query))
	}
}

/**
 * Injects request headers object in the method's parameters.
 * @param name - directly injects a specific header.
 * @see https://nodejs.org/api/http.html#http_message_headers
 * @example
 * ```ts
 * // Request headers object without invokation:
 * ＠Get('/some')
 * get(＠Headers headers: IncomingHttpHeaders) {}
 *
 * // Request headers object with invokation:
 * ＠Get('/some')
 * get(＠Headers() headers: IncomingHttpHeaders) {}
 *
 * // Single request header:
 * ＠Get('/some')
 * get(＠Headers('user-agent') userAgent: string) {}
 * ```
 * ------
 * @public
 */
export function Headers<T extends string = RequestHeaderName>(
	name?: T extends RequestHeaderName ? RequestHeaderName : string
): Decorator.Headers

export function Headers(...args: Parameters<Decorator.Headers>): void

export function Headers(nameOrTarget?: string | object, propertyKey?: string | symbol, parameterIndex?: number) {
	if (arguments.length === 3 && typeof nameOrTarget === 'object') {
		const target = nameOrTarget
		return createParamDecorator((req) => req.headers)(target, propertyKey!, parameterIndex!)
	} else {
		const subKey = nameOrTarget as string | undefined
		return createParamDecorator((req) => (subKey ? req.headers[subKey] : req.headers))
	}
}

/**
 * Creates a parameter decorator, to inject anything we want in decorated routes.
 *
 * @param mapper - function that should return the thing we want to inject from the Request object.
 * @param use - adds middlewares to the route if the mapper needs them (_e.g. we need body-parser middlewares to retrieve `req.body`_).
 * @param dedupeUse - marks the middlewares for deduplication based on the function reference and name (_e.g. if 'jsonParser' is already in use locally or globally, it won't be added again_).
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
 *   [express.json()],
 *   true
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
	use?: express.RequestHandler[],
	dedupeUse?: boolean
): Decorator.HandlerParameter {
	return (target, key, index) => {
		const params: ParamMeta[] = Reflect.getOwnMetadata(MetaKey, target, key) || []

		params.push({ index, mapper, use, dedupeUse })
		Reflect.defineMetadata(MetaKey, params, target, key)
	}
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
	const params: ParamMeta[] = Reflect.getOwnMetadata(MetaKey, target.prototype, key) || []

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
 * @internal
 */
export function extractParamsMiddlewares(
	target: ClassType,
	key: string | symbol,
	alreadyMwares: [
		express.RequestHandler[],
		express.RequestHandler[],
		express.RequestHandler[],
		express.RequestHandler[]
	]
): express.RequestHandler[] {
	const params: ParamMeta[] = Reflect.getOwnMetadata(MetaKey, target.prototype, key) || []
	if (!params.length) return []

	const paramMwares: express.RequestHandler[] = []

	let alreadyNames: string[] = []

	for (const { use, dedupeUse } of params) {
		if (!use) continue

		if (dedupeUse && !alreadyNames.length) {
			// Perform the flatmap only if one of the parameter requires deduplication.
			alreadyNames = flatMapFast(alreadyMwares, (m) => m.name)
		}

		for (const mware of use) {
			// If the same param decorator is used twice, we prevent adding its middlewares twice
			// whether or not it's marked for dedupe, to do that we simply compare by reference.
			if (paramMwares.includes(mware)) continue

			// Dedupe middlewares in upper layers.
			if (dedupeUse) {
				const sameRef =
					alreadyMwares[0].includes(mware) ||
					alreadyMwares[1].includes(mware) ||
					alreadyMwares[2].includes(mware) ||
					alreadyMwares[3].includes(mware)

				const sameName = !!mware.name && alreadyNames.includes(mware.name)

				// console.log('dedupe:', mware.name, sameRef || sameName)
				if (sameRef || sameName) continue
			}

			paramMwares.push(mware)

			// todo?: alreadyNames.push(mware.name)
			// Should we dedupe by *name* the same middleware on different param decorators ?
			// Or should we just warn the user of a potential conflict, and suggest to move
			// the middleware to an explicit place on the controller as an easy fix ?
			// See 'param middlewares deduplication' tests.
		}
	}

	return paramMwares
}
