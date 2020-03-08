import Mongoose from 'mongoose'
import { ConstructorType } from './interfaces'

/**
 * @private
 */
const MetaBaseDiscriminatorKey = Symbol('base-discriminator-key')

/**
 * Defines `discriminatorKey` property on the base/parent model.
 *
 * Applied directly on the discriminator class instead of the base model class (use `@DiscriminatorKey` for this case).
 *
 * @param value - the string stored in the property (defaults to the class name).
 *
 * @see https://mongoosejs.com/docs/discriminators.html#discriminator-keys
 * @public
 */
export function BaseDiscriminatorKey(value: string): PropertyDecorator

/**
 * {@inheritDoc (BaseDiscriminatorKey:1)}
 * @public
 */
export function BaseDiscriminatorKey(...args: Parameters<PropertyDecorator>): void

export function BaseDiscriminatorKey(valueOrTarget: string | Object, key?: string | symbol) {
	if (typeof valueOrTarget === 'string' && !key) {
		return (target: Object, key_: string | symbol) => {
			Reflect.defineMetadata(MetaBaseDiscriminatorKey, [key_, valueOrTarget], target.constructor)
		}
	} else {
		return Reflect.defineMetadata(MetaBaseDiscriminatorKey, [key, undefined], valueOrTarget.constructor)
	}
}

/**
 * @private
 */
export function getBaseDiscriminatorKey(target: object): [string | undefined, string | undefined] {
	return Reflect.getMetadata(MetaBaseDiscriminatorKey, target) || []
}

/**
 * @private
 */
export function assignBaseDiscriminatorKey(
	discriminatorClass: ConstructorType,
	baseModel: Mongoose.Model<Mongoose.Document>
): string | undefined {
	const [baseD11rKey, value] = getBaseDiscriminatorKey(discriminatorClass)
	const otherD11rs: { [key: string]: Mongoose.Model<any> } | undefined = baseModel.discriminators

	if (baseD11rKey || otherD11rs) {
		for (const otherD11rName in otherD11rs) {
			if (!otherD11rs.hasOwnProperty(otherD11rName)) continue
			const otherD11r = otherD11rs[otherD11rName]
			const otherD11rKey: string | undefined = otherD11r.schema.discriminatorMapping?.key

			if (otherD11rKey && otherD11rKey !== baseD11rKey) {
				if (!baseD11rKey) {
					throw Error(
						` Discriminator "${discriminatorClass.name}" must have @BaseDiscriminatorKey "${otherD11rKey}", like sibling discriminator "${otherD11rName}"`
					)
				}

				throw Error(
					` Discriminator "${discriminatorClass.name}" cannot use @BaseDiscriminatorKey "${baseD11rKey}", because sibling discriminator "${otherD11rName}" has different discriminatorKey "${otherD11rKey}"`
				)
			}
		}

		const parentD11rKey = baseModel.schema._userProvidedOptions.discriminatorKey

		if (parentD11rKey && parentD11rKey !== baseD11rKey) {
			throw Error(
				`Discriminator "${discriminatorClass.name}" Cannot overwrite custom discriminatorKey "${parentD11rKey}" on root model "${baseModel.modelName}" with @BaseDiscriminatorKey "${baseD11rKey}"`
			)
		}

		baseModel.schema.set('discriminatorKey', baseD11rKey)
	}

	return value
}
