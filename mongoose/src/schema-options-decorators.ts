import * as mongoose from 'mongoose'
import { checkDecoratorsOrder } from './check-decorator-order'
import { RefletMongooseError } from './reflet-error'
import { ClassType } from './interfaces'

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
export function SchemaOptions(options: mongoose.SchemaOptions): SchemaOptions.Decorator {
	return (target) => {
		checkDecoratorsOrder(target)
		Reflect.defineMetadata(MetaSchemaOptions, options, target)
	}
}

export namespace SchemaOptions {
	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongooseSchemaOptions?: never
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
function getSchemaOptions(target: ClassType): mongoose.SchemaOptions | undefined {
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
export function mergeSchemaOptionsAndKeys(target: ClassType): mongoose.SchemaOptions | undefined {
	let options = getSchemaOptions(target)
	const keys = getSchemaOptionsKeys(target)

	if (!!keys.CreatedAt || !!keys.UpdatedAt) {
		options = options || {}

		const createdAtError = () =>
			new RefletMongooseError(
				'TIMESTAMP_OPTION_CONFLICT',
				`Schema "${target.name}" cannot overwrite @CreatedAtKey "${
					keys.CreatedAt
				}" with different schema option "timestamps: ${JSON.stringify(options?.timestamps)}".`
			)

		const updatedAtError = () =>
			new RefletMongooseError(
				'TIMESTAMP_OPTION_CONFLICT',
				`Schema "${target.name}" cannot overwrite @UpdatedAtKey "${
					keys.UpdatedAt
				}" with different schema option "timestamps: ${JSON.stringify(options?.timestamps)}".`
			)

		if (options.timestamps === true) {
			if (keys.CreatedAt !== 'createdAt') {
				throw createdAtError()
			}
			/* istanbul ignore next - same */
			if (keys.UpdatedAt !== 'updatedAt') {
				throw updatedAtError()
			}
		}

		if (options.timestamps === false) {
			if (!!keys.CreatedAt) {
				throw createdAtError()
			}
			/* istanbul ignore next - same */
			if (!!keys.UpdatedAt) {
				throw updatedAtError()
			}
		}

		if (!!options.timestamps && typeof options.timestamps === 'object') {
			if (
				(options.timestamps.createdAt === true && keys.CreatedAt !== 'createdAt') ||
				(options.timestamps.createdAt === false && !!keys.CreatedAt) ||
				(typeof options.timestamps.createdAt === 'string' && keys.CreatedAt !== options.timestamps.createdAt)
			) {
				throw createdAtError()
			}

			/* istanbul ignore next - same */
			if (
				(options.timestamps.updatedAt === true && keys.UpdatedAt !== 'updatedAt') ||
				(options.timestamps.updatedAt === false && !!keys.UpdatedAt) ||
				(typeof options.timestamps.updatedAt === 'string' && keys.UpdatedAt !== options.timestamps.updatedAt)
			) {
				throw updatedAtError()
			}
		}

		options.timestamps = {
			createdAt: keys.CreatedAt || false,
			updatedAt: keys.UpdatedAt || false,
		}
	}

	if (!!keys.VersionKey) {
		options = options || {}

		const versionKeyError = () =>
			new RefletMongooseError(
				'VERSIONKEY_OPTION_CONFLICT',
				`Schema "${target.name}" cannot overwrite @VersionKey "${keys.VersionKey}" with different schema option "versionKey: ${options?.versionKey}".`
			)

		if (options.versionKey === false) {
			throw versionKeyError()
		}

		if (typeof options.versionKey === 'string' && options.versionKey !== keys.VersionKey) {
			throw versionKeyError()
		}

		options.versionKey = keys.VersionKey
	}

	return options
}
