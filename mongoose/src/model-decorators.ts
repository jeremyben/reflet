import Mongoose from 'mongoose'
import { createSchema } from './schema-creation'
import { assignBaseDiscriminatorKey } from './base-discriminator-key-decorator'

/**
 * Transforms the class directly into a Model class.
 * @param collection - custom collection name.
 * @param skipInit - whether to skip initialization (defaults to `false`).
 * @see https://mongoosejs.com/docs/models.html
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠Field({ type: String, required: true })
 *   name: string
 * }
 *
 * const user = await User.create({ name: 'Jeremy' })
 * ```
 * ---
 * @public
 */
export function Model<T extends Mongoose.Model<Mongoose.Document>>(collection?: string, skipInit?: boolean) {
	return (target: T) => {
		const schema = createSchema(target)
		// console.log('model-schema', schema)
		return Mongoose.model(target.name, schema, collection, skipInit) as any
	}
}

export namespace Model {
	/**
	 * Transforms the class directly into a Model class, whose schema is the intersection of the parent schema and the discriminator schema.
	 *
	 * The string stored in the `discriminatorKey` property will be the name of the class.
	 *
	 * @param rootModel - discriminated base model.
	 *
	 * @see https://mongoosejs.com/docs/discriminators.html#the-model-discriminator-function
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
	export function Discriminator<T extends Mongoose.Model<Mongoose.Document>>(rootModel: T) {
		return (target: T) => {
			const discriminatorValue = assignBaseDiscriminatorKey(target, rootModel)

			const schema = createSchema(target)
			// console.log('discriminator-schema', schema)
			return rootModel.discriminator(target.name, schema, discriminatorValue) as any
		}
	}

	/**
	 * Dummy class to extend from, in order to get all the types from mongoose Model and Document.
	 * @public
	 */
	export const Interface = class {} as Mongoose.Model<Mongoose.Document>

	/**
	 * Dummy class to extend from, in order to get all the types from mongoose Model and Document.
	 * @public
	 */
	export const I = Interface

	// todo: query helpers
	// https://mongoosejs.com/docs/guide.html#query-helpers
	// https://stackoverflow.com/questions/52856264/how-to-define-custom-query-helper-in-mongoose-model-with-typescript

	/**
	 * @public
	 */
	const InterfaceQuery = <QueryHelpers extends {}>() => class {} as Mongoose.Model<Mongoose.Document, QueryHelpers>
}
