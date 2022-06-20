import * as express from 'express'
import { ClassType, ClassOrMethodDecorator, ClassOrTypedMethodDecorator } from './interfaces'
import { isReadableStream } from './type-guards'
import { RefletExpressError } from './reflet-error'

const METAKEY_SEND = Symbol('send')

/**
 * Tells express to handle the method's return value and send it.
 *
 * @param options - Force json response type.
 * Return value will be sent with [`res.send`](https://expressjs.com/en/4x/api.html#res.send) by default.
 * Switch `json` option to `true` to send it with [`res.json`](https://expressjs.com/en/4x/api.html#res.json)
 *
 * ------
 * @example
 * ```ts
 * class Foo {
 *   ＠Send({ json: true })
 *   ＠Get('/some')
 *   get() {
 *     return 'bar' // content-type: application-json
 *   }
 * }
 * ```
 * ------
 * @public
 */
export function Send(options?: Send.Options): Send.Decorator

/**
 * Handle the method's return value with a custom handler.
 *
 * ------
 * @example
 * ```ts
 * class Foo {
 *   ＠Send<string>((data, { res }) => {
 *     res.json({ hello: data })
 *   })
 *   ＠Get('/some')
 *   get() {
 *     return 'world'
 *   }
 * }
 * ```
 * ------
 * @public
 */
export function Send<T>(handler?: Send.Handler<T>): Send.Decorator<T>
export function Send(optionsOrHandler: Send.Options | Send.Handler<any> = {}): Send.Decorator {
	return (target, key, descriptor) => {
		const sendHandler: Send.Handler<any> =
			typeof optionsOrHandler === 'function'
				? optionsOrHandler
				: optionsOrHandler.json
				? handleWithJsonMethod
				: handleWithSendMethod

		if (key) {
			Reflect.defineMetadata(METAKEY_SEND, sendHandler, target, key)
		} else {
			Reflect.defineMetadata(METAKEY_SEND, sendHandler, (target as Function).prototype)
		}
	}
}

export namespace Send {
	/**
	 * Options for `@Send` decorator.
	 * @public
	 */
	export type Options = {
		/** Forces using express `res.json` method to send response */
		json?: boolean
	}

	/**
	 * @public
	 */
	export type Handler<T> = (
		data: Awaited<T>,
		context: { req: express.Request; res: express.Response; next: express.NextFunction }
	) => void | Promise<void>

	/**
	 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
	 * @public
	 */
	export type Decorator<T = any> = ClassOrTypedMethodDecorator<T> & { __expressSend?: never }

	/**
	 * Prevents a method from having its return value being sent,
	 * if a `@Send` decorator is applied to its class.
	 *
	 * @example
	 * ```ts
	 * ＠Send()
	 * class Foo {
	 *   ＠Get('/some')
	 *   get() {
	 *     return 'hi'
	 *   }
	 *
	 *   ＠Send.Dont()
	 *   ＠Put('/some')
	 *   replace(req: Request, res: Response, next: NextFunction) {
	 *     res.send('hi')
	 *   }
	 * }
	 * ```
	 * ------
	 * @public
	 */
	export function Dont(): Send.Dont.Decorator
	export function Dont(...args: Parameters<Send.Dont.Decorator>): void
	export function Dont(targetMaybe?: any, keyMaybe?: any): Send.Dont.Decorator | void {
		if (targetMaybe) {
			if (keyMaybe) Reflect.defineMetadata(METAKEY_SEND, null, targetMaybe, keyMaybe)
			else Reflect.defineMetadata(METAKEY_SEND, null, (targetMaybe as Function).prototype)
		} else {
			return (target, key, descriptor) => {
				if (key) Reflect.defineMetadata(METAKEY_SEND, null, target, key)
				else Reflect.defineMetadata(METAKEY_SEND, null, (target as Function).prototype)
			}
		}
	}

	export namespace Dont {
		/**
		 * Equivalent to a union of `ClassDecorator` and `MethodDecorator`.
		 * @public
		 */
		export type Decorator = ClassOrMethodDecorator & { __expressSendDont?: never }
	}
}

/**
 * @internal
 */
export function extractSendHandler(
	target: ClassType,
	key: string | symbol,
	appClass?: ClassType
): Send.Handler<any> | null | undefined {
	// Send decorator on method
	const methodSendHandler: Send.Handler<any> | null | undefined = Reflect.getOwnMetadata(
		METAKEY_SEND,
		target.prototype,
		key
	)

	if (methodSendHandler !== undefined) {
		return methodSendHandler
	}

	// Send decorator on router
	const routerSendHandler: Send.Handler<any> | null | undefined = Reflect.getOwnMetadata(
		METAKEY_SEND,
		target.prototype
	)

	if (routerSendHandler !== undefined) {
		return routerSendHandler
	}

	// No Send decorator on method or router
	const appSendHandler: Send.Handler<any> | undefined = appClass
		? Reflect.getOwnMetadata(METAKEY_SEND, appClass.prototype)
		: undefined

	return appSendHandler
}

/**
 * @internal
 */
function handleWithSendMethod(
	value: any,
	{ req, res, next }: { req: express.Request; res: express.Response; next: express.NextFunction }
) {
	// Readable stream
	if (isReadableStream(value)) {
		value.pipe(res)
		return
	}

	// Response object itself
	if (value === res) {
		// A stream is piping to the response so we let it go
		if (res.listenerCount('unpipe') > 0) {
			return
		}

		// The response will try to send itself, which will cause a cryptic error
		// ('TypeError: Converting circular structure to JSON')
		next(new RefletExpressError('RESPONSE_OBJECT_SENT', `Cannot send the response object.`))
		return
	}

	res.send(value)
}

/**
 * @internal
 */
function handleWithJsonMethod(
	value: any,
	{ req, res, next }: { req: express.Request; res: express.Response; next: express.NextFunction }
) {
	// Readable stream
	if (isReadableStream(value)) {
		value.pipe(res)
		return
	}

	// Response object itself
	if (value === res) {
		// A stream is piping to the response so we let it go
		if (res.listenerCount('unpipe') > 0) {
			return
		}

		// The response will try to send itself, which will cause a cryptic error
		// ('TypeError: Converting circular structure to JSON')
		next(new RefletExpressError('RESPONSE_OBJECT_SENT', `Cannot send the response object.`))
		return
	}

	res.json(value)
}
