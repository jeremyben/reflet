/**
 * @decorator string
 */
export function PropString(): PropertyDecorator {
	return (target, key) => null
}

/**
 * @decorator {number}
 */
export const PropNumber: PropertyDecorator = () => null

/**
 * @decorator {@link PropGenericConstraint}
 */
export function PropGeneric<T>(option: T): PropertyDecorator {
	return (target, key) => null
}

type PropGenericConstraint<T> = T extends {} ? Partial<T> : never

export function PropGenerics<T, U>(option: T, other: U): PropertyDecorator {
	return (target, key) => null
}
