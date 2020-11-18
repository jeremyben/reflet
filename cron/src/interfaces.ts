/**
 * @public
 */
export type ClassType<T = any> = new (...args: any[]) => T

/**
 * @public
 */
export type ClassOrMethodDecorator = <TFunction extends Function>(
	target: TFunction | Object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any

/**
 * @public
 */
export type MethodKeys<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]
