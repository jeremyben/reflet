import Meta from './metadata-keys'
import { ClassOrMethodDecorator, ClassType, StatusU } from './interfaces'

/**
 * @public
 */
type SendOptions = {
	/** Forces using express `res.json` method to send response */
	json?: boolean

	/** Sets default response status */
	status?: StatusU

	/** Overrides response status for `undefined` return value */
	undefinedStatus?: StatusU

	/** Overrides response status for `null` return value */
	nullStatus?: StatusU
}

/**
 * Tells express to handle the method's return value and send it.
 *
 * Can be applied to a class or to specific methods.
 *
 * @decorator class, method
 * @public
 */
export function Send(options: SendOptions = {}): ClassOrMethodDecorator {
	return (target, key, descriptor) => {
		if (key) Reflect.defineMetadata(Meta.Send, options, target, key)
		else Reflect.defineMetadata(Meta.Send, options, target)
	}
}

/**
 * Prevents a method from having its return value being sent, if a `@Send` decorator is applied to the whole class.
 *
 * @decorator method
 * @public
 */
export function DontSend(): MethodDecorator {
	return (target, key, descriptor) => {
		Reflect.defineMetadata(Meta.Send, null, target, key)
	}
}

/**
 * Get methods metadata from the prototype (no need to create an instance).
 * @internal
 */
export function extractSend(target: ClassType, key: string | symbol): SendOptions | null {
	let toSend: SendOptions | null | undefined = Reflect.getOwnMetadata(Meta.Send, target.prototype, key)

	if (toSend === undefined) {
		toSend = Reflect.getOwnMetadata(Meta.Send, target) || null
	}

	return toSend!
}
