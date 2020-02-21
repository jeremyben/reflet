import Meta from './metadata-keys'
import { ClassType, StatusCode, Decorator } from './interfaces'

/**
 * @public
 */
type SendOptions = {
	/** Forces using express `res.json` method to send response */
	json?: boolean

	/** Sets default response status */
	status?: StatusCode

	/** Overrides response status for `undefined` return value */
	undefinedStatus?: StatusCode

	/** Overrides response status for `null` return value */
	nullStatus?: StatusCode
}

/**
 * Tells express to handle the method's return value and send it.
 *
 * @param options - to change the response status or force json response type.
 *
 * @remarks
 * Can be applied to a whole class and/or to specific methods.
 * Method options will extend class options.
 *
 * The return value will be sent with [`res.send`](https://expressjs.com/en/4x/api.html#res.send) by default.
 * Switch `json` option to `true`, to send it with [`res.json`](https://expressjs.com/en/4x/api.html#res.json).
 *
 * ------
 * Example:
 * ```ts
 * ＠Send({ nullStatus: 205, undefinedStatus: 404 })
 * class Foo {
 *   ＠Get('/some')
 *   get() {
 *     if (condition) return // 404 status
 *     return null // 205 status
 *   }
 *
 *   ＠Send({ status: 201 })
 *   ＠Post('/some')
 *   create() {
 *     return { foo: 1 } // 201 status
 *   }
 *
 *   ＠Send({ json: true })
 *   ＠Patch('/some')
 *   update() {
 *     return 'bar' // content-type: application-json
 *   }
 * }
 * ```
 * ------
 * @see https://expressjs.com/en/4x/api.html#res.send
 * @see https://expressjs.com/en/4x/api.html#res.json
 *
 * @decorator class, method
 * @public
 */
export function Send(options: SendOptions = {}): Decorator.Send {
	return (target, key, descriptor) => {
		if (key) Reflect.defineMetadata(Meta.Send, options, target, key)
		else Reflect.defineMetadata(Meta.Send, options, target)
	}
}

/**
 * Prevents a method from having its return value being sent,
 * if a `@Send` decorator is applied to its controller class.
 *
 * @remarks
 * Example:
 * ```ts
 * ＠Send()
 * class Foo {
 *   ＠Get('/some')
 *   get() {
 *     return 'hi'
 *   }
 *
 *   ＠DontSend()
 *   ＠Put('/some')
 *   replace(req: Request, res: Response, next: NextFunction) {
 *     res.send('hi')
 *   }
 * }
 * ```
 * ------
 * @decorator method
 * @public
 */
export function DontSend(): Decorator.DontSend {
	return (target, key, descriptor) => {
		Reflect.defineMetadata(Meta.Send, null, target, key)
	}
}

/**
 * Retrieve send options from both the method and the class,
 * so method options can extend class options.
 *
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractSend(target: ClassType, key: string | symbol): SendOptions | null {
	const sendOnClass: SendOptions | null = Reflect.getOwnMetadata(Meta.Send, target) || null
	const sendOnMethod: SendOptions | null | undefined = Reflect.getOwnMetadata(
		Meta.Send,
		target.prototype,
		key
	)

	switch (sendOnMethod) {
		// none
		case undefined:
			return sendOnClass

		// @DontSend
		case null:
			return sendOnMethod

		// @Send
		default:
			if (sendOnClass) return Object.assign({}, sendOnClass, sendOnMethod)
			else return sendOnMethod
	}
}
