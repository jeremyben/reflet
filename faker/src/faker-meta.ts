import { FakerNamespaceName, FakerMethodName } from './interfaces'

const MetaFaker = Symbol('faker')

/**
 * @internal
 */
export function getMethods(target: object): { [key: string]: MethodMeta<FakerNamespaceName, string> } {
	return Object.assign({}, Reflect.getMetadata(MetaFaker, target))
}

/**
 * @internal
 */
export function defineMethod<T extends FakerNamespaceName>({ methodPath, args }: MethodMeta<T>): PropertyDecorator {
	return (target, key) => {
		console.log(target, key)

		const props = getMethods(target.constructor)
		props[<string>key] = { methodPath: methodPath as any, args }
		Reflect.defineMetadata(MetaFaker, props, target.constructor)
	}
}

/**
 * @internal
 */
type MethodMeta<T extends FakerNamespaceName, M = FakerMethodName<T>> =
	| { methodPath: [T, M]; args: any[] }
	| { methodPath: ['fake']; args: any[] }
