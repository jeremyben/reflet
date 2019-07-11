/**
 * Checks if given object is Observable-like.
 * @see https://github.com/ReactiveX/rxjs/blob/master/src/internal/util/isObservable.ts
 * @internal
 */
export function isObservable(obj: any): boolean {
	return !!obj && (typeof obj.lift === 'function' && typeof obj.subscribe === 'function')
}

/**
 * Checks if given object is Promise-like.
 * @internal
 */
export function isPromise(obj: any): obj is Promise<any> {
	return obj != null && typeof obj === 'object' && typeof obj.then === 'function'
}

/**
 * Return the name of the caller.
 * @internal
 */
export function getCaller() {
	const stack = new Error().stack!.split('\n')
	const result = /([^(]+)@|at ([^(]+) \(/.exec(stack[2])!
	const caller = result[1] || result[2]

	return caller
}

/**
 * Creates a function that is restricted to invoking func once.
 * Repeat calls to the function return the value of the first invocation.
 * @see https://lodash.com/docs/#once
 * @internal
 */
export function once(fn: Function) {
	if (typeof fn !== 'function') throw TypeError('Expected a function')
	let invoked = false
	let result: any

	return () => {
		if (invoked) return result

		invoked = true
		result = fn.apply(null, arguments)

		return result
	}
}
