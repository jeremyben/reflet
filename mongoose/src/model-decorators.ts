import * as mongoose from 'mongoose'
import { createSchema } from './schema-creation'
import { registerModelDecorator } from './check-decorator-order'
import { getKind, assignModelKindKey } from './kind-decorator'
import { ModelI } from './model-interface'
import { RefletMongooseError } from './reflet-error'
import { ClassType, ModelAny } from './interfaces'

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
 * class User extends Model.I {
 *   ＠Field({ type: String, required: true })
 *   name: string
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 * ```
 * ---
 * @public
 */
export function Model<T extends ModelAny>(collection?: string, connection?: mongoose.Connection): Model.Decorator<T> {
	return (target) => {
		const schema = createSchema(target, { full: true })

		const model: any = connection
			? connection.model(target.name, schema, collection)
			: mongoose.model(target.name, schema, collection)

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
	export function Discriminator<T extends ModelAny>(rootModel: T): Model.Discriminator.Decorator<T> {
		return (target) => {
			if (!rootModel.prototype.$isMongooseModelPrototype) {
				throw new RefletMongooseError(
					'MISSING_ROOT_MODEL',
					`Discriminator "${target.name}" must have its root model "${rootModel.name}" decorated with @Model.`
				)
			}

			const [kindKey, kindValue] = getKind(target)
			assignModelKindKey({ kindKey, rootModel, discriminatorModel: target })

			// If the discriminator class extends the root class, e.g. `class Child extends Root`,
			// we don't worry about Child inheriting Reflet metadata from Root,
			// because Root has already been transformed into a Mongoose Model
			// which does not have any Reflet metadata.

			const schema = createSchema(target, { full: true })
			const modelDiscriminator = rootModel.discriminator(target.name, schema, kindValue)

			registerModelDecorator(modelDiscriminator, 'Model.Discriminator')

			return modelDiscriminator
		}
	}

	export namespace Discriminator {
		/**
		 * Equivalent to `ClassDecorator`.
		 * @public
		 */
		export type Decorator<T extends ClassType> = ((target: T) => any) & {
			__mongooseModelDiscriminator?: never
		}
	}

	/**
	 * Dummy class to extend from, to get all the (narrowed) types from mongoose Model and Document.
	 * @abstract
	 * @public
	 */
	export const Interface = class {} as unknown as typeof ModelI
	export type Interface<C extends ClassType = any> = ModelI<C>

	/**
	 * Dummy class to extend from, to get all the (narrowed) types from mongoose Model and Document.
	 * @abstract
	 * @public
	 */
	export const I = Interface
	export type I<C extends ClassType = any> = ModelI<C>

	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator<T extends ClassType> = ((target: T) => any) & {
		__mongooseModel?: never
	}
}
