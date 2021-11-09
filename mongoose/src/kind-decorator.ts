import * as mongoose from 'mongoose'
import { RefletMongooseError } from './reflet-error'

const MetaKind = Symbol('kind')

/**
 * Defines `discriminatorKey` property, **directly** on the discriminator class instead of the root model.
 * @param value - the string stored in the property (defaults to the class name).
 * @see https://mongoosejs.com/docs/discriminators#discriminator-keys
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠Field({ type: String })
 *   name: string
 * }
 *
 * ＠Model.Discriminator(User)
 * class Developer extends User {
 *   ＠Kind
 *   kind: 'Developer'
 * }
 * ```
 * ---
 * @public
 */
export function Kind(value?: string): Kind.Decorator

export function Kind(...args: Parameters<Kind.Decorator>): void

export function Kind(valueOrTarget?: string | Object, key?: string | symbol) {
	if (typeof valueOrTarget === 'string' && !key) {
		return (target: Object, keyy: string | symbol) => {
			/* istanbul ignore if - checked by the compiler */
			if (!valueOrTarget) {
				throw new RefletMongooseError(
					'EMPTY_DISCRIMINATOR_KEY',
					`Schema ${target.constructor.name} cannot have an empty @Kind (or @DiscriminatorKey) value`
				)
			}

			Reflect.defineMetadata(MetaKind, [keyy, valueOrTarget], target.constructor)
		}
	} else {
		return Reflect.defineMetadata(MetaKind, [key, undefined], valueOrTarget!.constructor)
	}
}

export namespace Kind {
	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyDecorator & {
		__mongooseKind?: never
	}
}

export { Kind as DiscriminatorKey }

/**
 * @internal
 */
export function getKind(target: object): [string?, string?] {
	return Reflect.getMetadata(MetaKind, target) || []
}

/**
 * Set `kindKey` as `discriminatorKey` on the root model.
 * @internal
 */
export function assignModelKindKey({
	kindKey,
	rootModel,
	discriminatorModel,
}: {
	kindKey: string | undefined
	rootModel: mongoose.Model<mongoose.Document>
	discriminatorModel: mongoose.Model<mongoose.Document>
}): void {
	const providedDiscriminatorKey = (rootModel.schema as SchemaFix)._userProvidedOptions.discriminatorKey
	const providedKindKey: string | undefined = (rootModel as any)[MetaKind]
	// const otherD11rs = rootModel.discriminators as { [key: string]: mongoose.Model<any> } | undefined

	// Check that sibling discriminators have the same @Kind key.
	if ((providedKindKey && !kindKey) || (providedKindKey && kindKey && providedKindKey !== kindKey)) {
		throw new RefletMongooseError(
			'DISCRIMINATOR_KEY_CONFLICT',
			`Discriminator "${discriminatorModel.name}" must have @Kind (or @DiscriminatorKey) named "${providedKindKey}", like its sibling discriminator(s).`
		)
	}

	// Then check overwriting of the discriminatorKey provided by the user on the root model.
	if (providedDiscriminatorKey && kindKey && providedDiscriminatorKey !== kindKey) {
		throw new RefletMongooseError(
			'DISCRIMINATOR_KEY_CONFLICT',
			`Discriminator "${discriminatorModel.name}" cannot overwrite discriminatorKey "${providedDiscriminatorKey}" of root model "${rootModel.modelName}" with @Kind (or @DiscriminatorKey) named "${kindKey}".`
		)
	}

	// Finally assign the key on the root model and keep reference of @Kind key, only once for all discriminators.
	if (kindKey && !providedKindKey) {
		;(rootModel as any)[MetaKind] = kindKey
		rootModel.schema.set('discriminatorKey', kindKey)
	}

	type SchemaFix = mongoose.Schema & { _userProvidedOptions: mongoose.SchemaOptions }
}
