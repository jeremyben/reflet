import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ConstructorType, Decorator, DocumentAny } from './interfaces'

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
): Decorator.SchemaCallback {
	return (Class) => {
		checkDecoratorsOrder(Class)
		Reflect.defineMetadata(MetaSchemaCallback, callback, Class)
	}
}

/**
 * @internal
 */
export function applySchemaCallback(schema: mongoose.Schema<any>, target: ConstructorType): void {
	const schemaCallback = Reflect.getMetadata(MetaSchemaCallback, target) as ((s: mongoose.Schema) => void) | undefined

	if (typeof schemaCallback === 'function') {
		schemaCallback(schema)
	}
}
