import Mongoose from 'mongoose'
import { ConstructorType } from './interfaces'

//
// ═════════ Schema Options (Class) ═════════
//

/**
 * @private
 */
const MetaSchemaOptions = Symbol('schema-options')

/**
 * Defines schema options.
 * @see https://mongoosejs.com/docs/guide.html#options
 * @public
 */
export function SchemaOptions(options: Mongoose.SchemaOptions): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(MetaSchemaOptions, options, target)
	}
}

/**
 * @private
 */
export function getSchemaOptions(target: ConstructorType): Mongoose.SchemaOptions | undefined {
	return Reflect.getMetadata(MetaSchemaOptions, target)
}

//
// ═════════ Schema Callback (Class) ═════════
//

/**
 * @private
 */
const MetaSchemaCallback = Symbol('schema-callback')

/**
 * Allows more advanced schema manipulation, after its creation.
 * @see https://mongoosejs.com/docs/api/schema.html
 * @public
 */
export function SchemaCallback<T>(cb: (schema: Mongoose.Schema<T>) => void): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(MetaSchemaCallback, cb, target)
	}
}

/**
 * @private
 */
export function getSchemaCallback(target: ConstructorType): ((schema: Mongoose.Schema) => void) | undefined {
	return Reflect.getMetadata(MetaSchemaCallback, target)
}
