import * as mongoose from 'mongoose'
import { ConstructorType, Decorator } from './interfaces'

const MetaSchemaCallback = Symbol('schema-callback')

/**
 * Allows more advanced schema manipulation, after its creation.
 * @see https://mongoosejs.com/docs/api/schema
 * @example
 * ```ts
 * ＠Model()
 * ＠SchemaCallback((schema) => {
 *   schema.index({ name: 1, type: -1 })
 * })
 * class Animal extends Model.Interface {
 *   ＠Field.Type(String)
 *   name: string
 *
 *   ＠Field.Type(String)
 *   type: string
 * }
 * ```
 * ---
 * @public
 */
export function SchemaCallback<T>(callback: (schema: mongoose.Schema<T>) => void): Decorator.SchemaCallback {
	return (Class) => {
		if (Class.prototype.$isMongooseModelPrototype) {
			throw Error(`You must put @Model at the top of "${(Class as any).modelName}" decorators`)
		}

		Reflect.defineMetadata(MetaSchemaCallback, callback, Class)
	}
}

/**
 * @internal
 */
export function getSchemaCallback(target: ConstructorType): ((schema: mongoose.Schema) => void) | undefined {
	return Reflect.getMetadata(MetaSchemaCallback, target)
}
