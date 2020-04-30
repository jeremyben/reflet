import * as mongoose from 'mongoose'
import { Decorator } from './interfaces'

/**
 * Used by `@Model.Discriminator` to keep a reference of already defined `@Kind`.
 * @internal
 */
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
export function Kind(value?: string): Decorator.Kind

/**
 * {@inheritDoc (Kind:1)}
 * @public
 */
export function Kind(...args: Parameters<Decorator.Kind>): void

export function Kind(valueOrTarget?: string | Object, key?: string | symbol) {
	if (typeof valueOrTarget === 'string' && !key) {
		return (target: Object, key_: string | symbol) => {
			/* istanbul ignore if - checked by the compiler */
			if (!valueOrTarget) throw Error(`Schema ${target.constructor.name} cannot have an empty @Kind value`)

			Reflect.defineMetadata(MetaKind, [key_, valueOrTarget], target.constructor)
		}
	} else {
		return Reflect.defineMetadata(MetaKind, [key, undefined], valueOrTarget!.constructor)
	}
}

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
export function assignKindKey({
	kindKey,
	rootModel,
	discriminatorModel,
}: {
	kindKey: string | undefined
	rootModel: mongoose.Model<mongoose.Document>
	discriminatorModel: mongoose.Model<mongoose.Document>
}): void {
	const rootProvidedD11rKey = (rootModel.schema as SchemaFix)._userProvidedOptions.discriminatorKey
	const alreadyProvidedKindKey = rootModel[(MetaKind as unknown) as keyof mongoose.Model<any>]
	// const otherD11rs = rootModel.discriminators as { [key: string]: mongoose.Model<any> } | undefined

	// Check that sibling discriminators have the same @Kind key.
	if (
		(alreadyProvidedKindKey && !kindKey) ||
		(alreadyProvidedKindKey && kindKey && alreadyProvidedKindKey !== kindKey)
	) {
		throw Error(
			`Discriminator "${discriminatorModel.name}" must have @Kind named "${alreadyProvidedKindKey}", like its sibling discriminator(s).`
		)
	}

	// Then check overwriting of the discriminatorKey provided by the user on the root model.
	if (rootProvidedD11rKey && kindKey && rootProvidedD11rKey !== kindKey) {
		throw Error(
			`Discriminator "${discriminatorModel.name}" Cannot overwrite discriminatorKey "${rootProvidedD11rKey}" of root model "${rootModel.modelName}" with @Kind named "${kindKey}".`
		)
	}

	// Finally assign the key on the root model and keep reference of @Kind key, only once for all discriminators.
	if (kindKey && !alreadyProvidedKindKey) {
		rootModel[(MetaKind as unknown) as keyof mongoose.Model<any>] = kindKey
		rootModel.schema.set('discriminatorKey', kindKey)
	}

	type SchemaFix = mongoose.Schema & { _userProvidedOptions: mongoose.SchemaOptions }
}
