import type { ClassType } from './interfaces'

export const hasOwn = (object: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(object, key)

// Not `instanceof Error`, which fails for errors from another realm (e.g. Node.js internals in a VM context).
export const errorMessage = (err: any): string =>
	err && typeof err.message === 'string' ? (err.message as string) : String(err)

/**
 * Standard decorators (without the TypeScript option) receive a context object instead.
 */
export function checkExperimentalDecorators(target: unknown, propertyKey: unknown): void {
	if (target === undefined || (typeof propertyKey === 'object' && propertyKey !== null)) {
		throw new Error('@reflet/env decorators require the "experimentalDecorators" TypeScript option.')
	}
}

/**
 * Classes of the hierarchy, from the given one up to its ancestors.
 */
export function ancestry(target: ClassType): ClassType[] {
	const all: ClassType[] = []
	for (let cls = target; cls && cls !== Function.prototype; cls = Object.getPrototypeOf(cls)) all.push(cls)
	return all
}

export function deepFreeze<T>(value: T): T {
	// Buffers and other typed arrays can't be frozen.
	if (value && typeof value === 'object' && !Object.isFrozen(value) && !ArrayBuffer.isView(value)) {
		Object.freeze(value)
		for (const child of Object.values(value)) deepFreeze(child)
	}
	return value
}
