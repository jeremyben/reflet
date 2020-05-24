/**
 * Mutates the `added` array.
 * @see https://dev.to/uilicious/javascript-array-push-is-945x-faster-than-array-concat-1oki
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
			/* istanbul ignore else - unused */
			if (mapper) {
				flattened[i] = mapper(value)
			}

			i++
		}
	}

	return flattened
}
