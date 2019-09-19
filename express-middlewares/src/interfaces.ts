/**
 * @public
 */
export type ClassOrMethodDecorator = (
	target: object,
	propertyKey?: string | symbol,
	descriptor?: TypedPropertyDescriptor<any>
) => any
