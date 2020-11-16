import * as mongoose from 'mongoose'
import { createSchema } from './schema-creation'
import { registerModelDecorator } from './check-decorator-order'
import { getKind, assignKindKey } from './kind-decorator'
import { IModel } from './i-model'
import { Decorator, ModelAny } from './interfaces'

/**
 * Transforms the decorated class into a mongoose Model.
 *
 * `Model` decorator should always be at the top of class decorators.
 *
 * @param collection - custom collection name.
 * @param connection - mongoose connection to use in case of [multiple connections](https://mongoosejs.com/docs/connections#multiple_connections).
 *
 * @see https://mongoosejs.com/docs/models
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.I<User> {
 *   ＠Field({ type: String, required: true })
 *   name: string
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 * ```
 * ---
 * @public
 */
export function Model<T extends ModelAny>(collection?: string, connection?: mongoose.Connection): Decorator.Model<T> {
	return (Class) => {
		const schema = createSchema(Class)

		if (connection) return connection.model(Class.name, schema, collection)
		const model = mongoose.model(Class.name, schema, collection)

		registerModelDecorator(model, 'Model')

		return model
	}
}

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
	export function Discriminator<T extends ModelAny>(rootModel: T): Decorator.ModelDiscriminator<T> {
		return (Class) => {
			if (!rootModel.prototype.$isMongooseModelPrototype) {
				throw Error(
					`Discriminator "${Class.name}" must have its root model "${rootModel.name}" decorated with @Model.`
				)
			}

			const [kindKey, kindValue] = getKind(Class)
			assignKindKey({ kindKey, rootModel, discriminatorModel: Class })

			// If the discriminator class extends the root class, e.g. `class Child extends Root`,
			// we don't worry about Child inheriting Reflet metadata from Root,
			// because Root has already been transformed into a Mongoose Model
			// which does not have any Reflet metadata.

			const schema = createSchema(Class)
			const modelDiscriminator = rootModel.discriminator(Class.name, schema, kindValue)

			registerModelDecorator(modelDiscriminator, 'Model.Discriminator')

			return modelDiscriminator
		}
	}

	/**
	 * Dummy class to extend from, to get all the (narrowed) types from mongoose Model and Document.
	 * @abstract
	 * @public
	 */
	export const Interface = IModel
	export type Interface = IModel

	/**
	 * Dummy class to extend from, to get all the (narrowed) types from mongoose Model and Document.
	 * @abstract
	 * @public
	 */
	export const I = IModel
	export type I = IModel
}
