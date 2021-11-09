import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ClassType, DocumentAny } from './interfaces'
import { RefletMongooseError } from './reflet-error'

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
export function SchemaCallback<T extends DocumentAny>(
	callback: (schema: mongoose.Schema<T>) => void
): SchemaCallback.Decorator {
	return (target) => {
		checkDecoratorsOrder(target)
		Reflect.defineMetadata(MetaSchemaCallback, callback, target)
	}
}

export namespace SchemaCallback {
	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongooseSchemaCallback?: never
	}
}

/**
 * @internal
 */
export function applySchemaCallback(schema: mongoose.Schema<any>, target: ClassType): void {
	const schemaCallback = Reflect.getMetadata(MetaSchemaCallback, target) as ((s: mongoose.Schema) => void) | undefined

	if (typeof schemaCallback === 'function') {
		schemaCallback(schema)
	}
}
