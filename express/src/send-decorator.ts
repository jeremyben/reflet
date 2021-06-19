import { ClassType, StatusCode, Decorator } from './interfaces'

const META = Symbol('send')

/**
 * Tells express to handle the method's return value and send it. Can be applied to a whole class and/or to specific methods.
 *
 * @param options - change the response status or force json response type.
 * The return value will be sent with [`res.send`](https://expressjs.com/en/4x/api.html#res.send) by default, switch `json` option to `true` to send it with [`res.json`](https://expressjs.com/en/4x/api.html#res.json).
 * _Method's options will extend class' options._
 *
 * @see https://expressjs.com/en/4x/api.html#res.send
 * @see https://expressjs.com/en/4x/api.html#res.json
 *
 * @example
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
 * @public
 */
export function Send(options: Send.Options = {}): Decorator.Send {
	return (target, key, descriptor) => {
		if (key) Reflect.defineMetadata(META, options, target, key)
		else Reflect.defineMetadata(META, options, target)
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

		/** Sets default response status */
		status?: StatusCode

		/** Overrides response status for `undefined` return value */
		undefinedStatus?: StatusCode

		/** Overrides response status for `null` return value */
		nullStatus?: StatusCode
	}

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
	export function Dont(): Decorator.DontSend {
		return (target, key, descriptor) => {
			if (key) Reflect.defineMetadata(META, null, target, key)
			else Reflect.defineMetadata(META, null, target)
		}
	}
}

/**
 * @deprecated use `@Send.Dont()`
 * @public
 */
/* istanbul ignore next - deprecated and replaced by same logic */
export function DontSend(): Decorator.DontSend {
	return (target, key, descriptor) => {
		if (key) Reflect.defineMetadata(META, null, target, key)
		else Reflect.defineMetadata(META, null, target)
	}
}

/**
 * Retrieve send options from both the method and the class, so method options can extend class options.
 * @internal
 */
export function extractSend(
	target: ClassType,
	key: string | symbol,
	appClass?: ClassType
): Send.Options | null | undefined {
	const appSend: Send.Options | undefined = appClass ? Reflect.getOwnMetadata(META, appClass) : undefined

	const controllerSend: Send.Options | null | undefined = Reflect.getOwnMetadata(META, target)

	const methodSend: Send.Options | null | undefined = Reflect.getOwnMetadata(META, target.prototype, key)

	// Send on method
	if (methodSend) {
		if (appSend || controllerSend) {
			return Object.assign({}, appSend, controllerSend, methodSend)
		} else {
			return methodSend
		}
	} else {
		// No Send on method
		if (methodSend === undefined) {
			// Send on router
			if (controllerSend) {
				return Object.assign({}, appSend, controllerSend)
			} else {
				// No Send on method or router
				if (controllerSend === undefined) {
					return appSend
				}

				// Send.Dont on router
				else {
					return null
				}
			}
		}

		// Send.Dont on method
		else {
			return null
		}
	}
}
