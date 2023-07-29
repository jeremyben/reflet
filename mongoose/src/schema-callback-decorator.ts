import type * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { ClassType, DocumentAny } from './interfaces'
import { RefletMongooseError } from './reflet-error'
import { defineMetadata, getMetadata } from './metadata-map'

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

		const previousCallback = getSchemaCallback(target)

		if (previousCallback) {
			throw new RefletMongooseError(
				'SCHEMA_CALLBACK_MISSING_MODIFIER',
				`@SchemaCallback has already been applied on "${target.name}" or its prototype chain, use @SchemaCallback.Override.`
			)
		}

		defineMetadata(MetaSchemaCallback, callback, target)
	}
}

export namespace SchemaCallback {
	/**
	 * Same as {@link SchemaCallback}, but used as an explicit override.
	 * @public
	 */
	export function Override<T extends DocumentAny>(
		callback: (schema: mongoose.Schema<T>) => void
	): SchemaCallback.Decorator {
		return (target) => {
			checkDecoratorsOrder(target)

			const parentOrSiblingCallback = getSchemaCallback(target)
			if (!parentOrSiblingCallback) {
				console.warn(
					`RefletMongooseWarning: No need to use @SchemaCallback.Override on "${target.name}", simply use @SchemaCallback.`
				)
			}

			defineMetadata(MetaSchemaCallback, callback, target)
		}
	}

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
	const callback = getSchemaCallback(target)

	if (typeof callback === 'function') {
		callback(schema)
	}
}

/**
 * @internal
 */
function getSchemaCallback(target: Function): ((s: mongoose.Schema) => void) | undefined {
	return getMetadata(MetaSchemaCallback, target)
}
