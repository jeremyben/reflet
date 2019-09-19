/* istanbul ignore file */

/**
 * Checks if given object is a Promise or Promise-like.
 * @internal
 */
export function isPromise<T = any>(obj: any): obj is Promise<T> {
	return obj instanceof Promise || (!!obj && typeof obj === 'object' && typeof obj.then === 'function')
}
