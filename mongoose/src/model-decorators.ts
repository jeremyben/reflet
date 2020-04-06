import mongoose from 'mongoose'
import { createSchema } from './schema-creation'
import { getKind, MetaKind } from './kind-decorator'
import { Decorator } from './interfaces'

/**
 * Transforms the decorated class into a mongoose Model.
 *
 * `Model` decorator should always be at the top of class decorators.
 *
 * @param collection - custom collection name.
 * @param connection - mongoose connection to use in case of [multiple connections](https://mongoosejs.com/docs/connections.html#multiple_connections).
 *
 * @see https://mongoosejs.com/docs/models
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠Field({ type: String, required: true })
 *   name: string
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 * ```
 * ---
 * @public
 */
export function Model<T extends mongoose.Model<mongoose.Document>>(
	collection?: string,
	connection?: mongoose.Connection
): Decorator.Model<T> {
	return (Class) => {
		const schema = createSchema(Class)

		if (connection) return connection.model(Class.name, schema, collection)
		return mongoose.model(Class.name, schema, collection)
	}
}

/* istanbul ignore next https://github.com/istanbuljs/nyc/issues/1209 */
export namespace Model {
	/**
	 * Transforms the decorated class into a mongoose Model, whose schema is the intersection of the parent schema and the discriminator schema.
	 *
	 * The string stored in the `discriminatorKey` property will be the name of the class (you can change it with the help of `Kind` decorator).
	 *
	 * `Model.Discriminator` decorator should always be at the top of class decorators.
	 *
	 * @param rootModel - discriminated base model.
	 *
	 * @see https://mongoosejs.com/docs/discriminators#the-model-discriminator-function
	 *
	 * @example
	 * ```ts
	 * ＠Model()
	 * class User extends Model.Interface {
	 *   ＠Field({ type: String, required: true })
	 *   name: string
	 * }
	 *
	 * ＠Model.Discrminator(User)
	 * class Worker extends User {
	 *   ＠Field({ type: String, required: true })
	 *   job: string
	 * }
	 *
	 * const worker = await Worker.create({ name: 'Jeremy', job: 'developer' })
	 * ```
	 * ---
	 * @public
	 */
	export function Discriminator<T extends mongoose.Model<mongoose.Document>>(
		rootModel: T
	): Decorator.ModelDiscriminator<T> {
		return (Class) => {
			const [kindKey, kindValue] = getKind(Class)
			const rootProvidedD11rKey = (rootModel.schema as SchemaFix)._userProvidedOptions.discriminatorKey
			const alreadyProvidedKindKey = rootModel[(MetaKind as unknown) as keyof mongoose.Model<any>]
			// const otherD11rs = rootModel.discriminators as { [key: string]: mongoose.Model<any> } | undefined

			// Check that sibling discriminators have the same @Kind key.
			if (
				(alreadyProvidedKindKey && !kindKey) ||
				(alreadyProvidedKindKey && kindKey && alreadyProvidedKindKey !== kindKey)
			) {
				throw Error(
					`Discriminator "${Class.name}" must have @Kind named "${alreadyProvidedKindKey}", like its sibling discriminator(s).`
				)
			}

			// Then check overwriting of the discriminatorKey provided by the user on the root model.
			if (rootProvidedD11rKey && kindKey && rootProvidedD11rKey !== kindKey) {
				throw Error(
					`Discriminator "${Class.name}" Cannot overwrite discriminatorKey "${rootProvidedD11rKey}" of root model "${rootModel.modelName}" with @Kind named "${kindKey}".`
				)
			}

			// Finally assign the key on the root model and keep reference of @Kind key, only once for all discriminators.
			if (kindKey && !alreadyProvidedKindKey) {
				rootModel[(MetaKind as unknown) as keyof mongoose.Model<any>] = kindKey
				rootModel.schema.set('discriminatorKey', kindKey)
			}

			const schema = createSchema(Class)
			return rootModel.discriminator(Class.name, schema, kindValue)

			type SchemaFix = mongoose.Schema & { _userProvidedOptions: mongoose.SchemaOptions }
		}
	}

	/**
	 * Dummy class to extend from, in order to get all the types from mongoose Model and Document.
	 */
	export const Interface = class {} as mongoose.Model<mongoose.Document>
	export type Interface = typeof Model.Interface

	/**
	 * Dummy class to extend from, in order to get all the types from mongoose Model and Document.
	 * @public
	 */
	export const I = Interface
	export type I = typeof Model.I

	// todo: query helpers
	// https://mongoosejs.com/docs/guide#query-helpers
	// https://stackoverflow.com/questions/52856264/how-to-define-custom-query-helper-in-mongoose-model-with-typescript

	/**
	 * @public
	 */
	const InterfaceQuery = <QueryHelpers extends {}>() => class {} as mongoose.Model<mongoose.Document, QueryHelpers>
}
