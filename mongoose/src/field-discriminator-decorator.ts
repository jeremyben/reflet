import { ConstructorType } from './interfaces'

/**
 * @private
 */
const MetaFieldDiscriminators = Symbol('field-discriminators')

/**
 * @see https://mongoosejs.com/docs/discriminators.html#embedded-discriminators-in-arrays
 * @public
 */
export function FieldDiscriminators(schemaClasses: ConstructorType[], discriminatorKey?: string): PropertyDecorator {
	return (target, key) => {
		const fieldDiscriminators = getFieldDiscriminators(target.constructor)
		fieldDiscriminators[<string>key] = schemaClasses
		Reflect.defineMetadata(MetaFieldDiscriminators, fieldDiscriminators, target.constructor)
	}
}

/**
 * @private
 */
export function getFieldDiscriminators(target: object): { [key: string]: ConstructorType[] } {
	// Clone the object to avoid inheritance issues like
	// https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaFieldDiscriminators, target))
}
