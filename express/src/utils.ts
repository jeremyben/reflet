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
 * Mutates the `source` array.
 * @see https://dev.to/uilicious/javascript-array-push-is-945x-faster-than-array-concat-1oki
 * @internal
 */
export function concatFast<T>(source: T[], added: T[]): T[] {
	const sourceLength = source.length
	const addedLength = added.length

	// Preallocate size
	source.length = sourceLength + addedLength

	for (let i = 0; i < addedLength; i++) {
		source[sourceLength + i] = added[i]
	}

	return source
}

/**
 * Mutates the `added` array.
 * @internal
 */
export function concatPrependFast<T>(source: T[], added: T[]): T[] {
	const sourceLength = source.length
	const addedLength = added.length

	// Preallocate size
	added.length = sourceLength + addedLength

	for (let i = 0; i < sourceLength; i++) {
		added[addedLength + i] = source[i]
	}

	return added
}

/**
 * Apparently the fastest implementation of `Array.flat` out there,
 * to which we add an optional `map` feature.
 * @see https://github.com/elidoran/flatten-array
 * @internal
 */
export function flatMapFast<T>(array: T[][]): T[]

/**
 * {@inheritDoc (flatMapFast:1)}
 */
export function flatMapFast<T, U>(array: T[][], mapper: (value: T) => U): U[]

export function flatMapFast<T, U>(array: T[][], mapper?: (value: T) => U): U[] {
	// wrapping the original array to avoid mutating it.
	const flattened: any[] = [array]

	// usual loop, but, don't put `i++` in third clause
	// because it won't increment it when the element is an array.
	for (let i = 0; i < flattened.length; ) {
		const value = flattened[i]

		// if the element is an array then we'll put its contents
		// into `flattened` replacing the current element.
		if (Array.isArray(value)) {
			if (value.length > 0) {
				// to provide the `value` array to splice()
				// we need to add the splice() args to its front,
				// these args tell it to splice at `i` and delete what's at `i`.
				value.unshift(i, 1)

				// in-place change
				flattened.splice.apply(flattened, value as any)

				// take (i, 1) back off the `value` front so it remains "unchanged".
				value.splice(0, 2)
			} else {
				// remove an empty array from `flattened`
				flattened.splice(i, 1)
			}

			// we don't do `i++` because we want it to re-evaluate the new element
			// at `i` in case it is an array, or we deleted an empty array at `i`.
		} else {
			// it's not an array so map the value and move on to the next element.
			if (mapper) flattened[i] = mapper(value)
			i++
		}
	}

	return flattened
}

/**
 * @see https://stackoverflow.com/a/9229821/4776628
 * @internal
 */
export function uniqFast<T extends string | number>(array: T[]): T[] {
	const seen: { [value: string]: true } = {}
	const uniq: T[] = []

	const length = array.length
	let j = 0

	for (let i = 0; i < length; i++) {
		const value = array[i]

		if (seen[value] !== true) {
			seen[value] = true
			uniq[j++] = value
		}
	}

	return uniq
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
