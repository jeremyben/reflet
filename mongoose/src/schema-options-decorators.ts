import * as mongoose from 'mongoose'
import { ConstructorType, Decorator } from './interfaces'

const MetaSchemaOptions = Symbol('schema-options')
const MetaSchemaOptionsKeys = Symbol('schema-options-keys')

/**
 * Defines schema options.
 * @see https://mongoosejs.com/docs/guide#options
 * @example
 * ```ts
 * ＠SchemaOptions({ minimize: false, autoIndex: false })
 * class User {
 *   ＠Field({ type: String })
 *   name: string
 * }
 * ```
 * ---
 * @public
 */
export function SchemaOptions(options: mongoose.SchemaOptions): Decorator.SchemaOptions {
	return (Class) => {
		if (Class.prototype.$isMongooseModelPrototype) {
			throw Error(`You must put @Model at the top of "${(Class as any).modelName}" decorators`)
		}

		Reflect.defineMetadata(MetaSchemaOptions, options, Class)
	}
}

/**
 * @internal
 */
type SchemaOptionsKeysMeta = Partial<{
	CreatedAt: string
	UpdatedAt: string
	VersionKey: string
}>

/**
 * Defines timestamp key directly in the model.
 * @see https://mongoosejs.com/docs/guide#timestamps
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠CreatedAt
 *   createdAt: Date
 *
 *   ＠UpdatedAt
 *   updatedAt: Date
 * }
 * ```
 * ---
 * @public
 */
export const CreatedAt: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.CreatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * {@inheritDoc (CreatedAt:1)}
 * @public
 */
export const UpdatedAt: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.UpdatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/guide#versionKey
 *
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠VersionKey
 *   version: number
 * }
 * ```
 * ---
 * @public
 */
export const VersionKey: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.VersionKey = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * @internal
 */
function getSchemaOptions(target: ConstructorType): mongoose.SchemaOptions | undefined {
	return Reflect.getMetadata(MetaSchemaOptions, target)
}

/**
 * @internal
 */
function getSchemaOptionsKeys(target: object): SchemaOptionsKeysMeta {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaSchemaOptionsKeys, target))
}

/**
 * Checks that options from @SchemaOptions decorator does not overwrite custom keys decorators.
 * Then assign custom keys to schema options.
 * @internal
 */
export function mergeSchemaOptionsAndKeys(Class: ConstructorType): mongoose.SchemaOptions | undefined {
	let options = getSchemaOptions(Class)
	const keys = getSchemaOptionsKeys(Class)

	if (!!keys.CreatedAt || !!keys.UpdatedAt) {
		options = options || {}

		const createdAtError = `Schema "${Class.name}" cannot overwrite @CreatedAtKey "${
			keys.CreatedAt
		}" with different schema option "timestamps: ${JSON.stringify(options.timestamps)}".`

		const updatedAtError = `Schema "${Class.name}" cannot overwrite @UpdatedAtKey "${
			keys.UpdatedAt
		}" with different schema option "timestamps: ${JSON.stringify(options.timestamps)}".`

		if (options.timestamps === true) {
			if (keys.CreatedAt !== 'createdAt') throw Error(createdAtError)
			/* istanbul ignore next - same */
			if (keys.UpdatedAt !== 'updatedAt') throw Error(updatedAtError)
		}

		if (options.timestamps === false) {
			if (!!keys.CreatedAt) throw Error(createdAtError)
			/* istanbul ignore next - same */
			if (!!keys.UpdatedAt) throw Error(updatedAtError)
		}

		if (!!options.timestamps && typeof options.timestamps === 'object') {
			if (
				(options.timestamps.createdAt === true && keys.CreatedAt !== 'createdAt') ||
				(options.timestamps.createdAt === false && !!keys.CreatedAt) ||
				(typeof options.timestamps.createdAt === 'string' && keys.CreatedAt !== options.timestamps.createdAt)
			) {
				throw Error(createdAtError)
			}

			/* istanbul ignore next - same */
			if (
				(options.timestamps.updatedAt === true && keys.UpdatedAt !== 'updatedAt') ||
				(options.timestamps.updatedAt === false && !!keys.UpdatedAt) ||
				(typeof options.timestamps.updatedAt === 'string' && keys.UpdatedAt !== options.timestamps.updatedAt)
			) {
				throw Error(updatedAtError)
			}
		}

		options.timestamps = {
			createdAt: keys.CreatedAt || false,
			updatedAt: keys.UpdatedAt || false,
		}
	}

	if (!!keys.VersionKey) {
		options = options || {}

		const versionKeyError = `Schema "${Class.name}" cannot overwrite @VersionKey "${keys.VersionKey}" with different schema option "versionKey: ${options.versionKey}".`

		if (options.versionKey === false) {
			throw Error(versionKeyError)
		}

		if (typeof options.versionKey === 'string' && options.versionKey !== keys.VersionKey) {
			throw Error(versionKeyError)
		}

		options.versionKey = keys.VersionKey
	}

	return options
}
