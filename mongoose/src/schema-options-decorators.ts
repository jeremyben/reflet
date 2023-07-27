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

		const previousOptions = getSchemaOptions(target)

		if (previousOptions) {
			throw new RefletMongooseError(
				'SCHEMA_OPTIONS_MISSING_MODIFIER',
				`@SchemaOptions has already been applied on "${target.name}" or its prototype chain, use @SchemaOptions.Override or @SchemaOptions.Merge.`
			)
		}

		Reflect.defineMetadata(MetaSchemaOptions, options, target)
	}
}

export namespace SchemaOptions {
	/**
	 * Same as {@link SchemaOptions}, but only with options allowed in discriminators.
	 * @public
	 */
	export function Discriminator(
		options: Pick<mongoose.SchemaOptions, '_id' | 'id' | 'toJSON' | 'toObject'>
	): SchemaOptions.Decorator {
		return SchemaOptions(options)
	}

	/**
	 * Same as {@link SchemaOptions}, but will extend options from the prototype chain.
	 * @public
	 */
	export function Merge(options: mongoose.SchemaOptions): SchemaOptions.Decorator {
		return (target) => {
			checkDecoratorsOrder(target)

			const parentOrSiblingOptions = getSchemaOptions(target)

			if (parentOrSiblingOptions) {
				const mergedOptions = assignDeep({}, parentOrSiblingOptions, options)
				Reflect.defineMetadata(MetaSchemaOptions, mergedOptions, target)
			} else {
				console.warn(
					`RefletMongooseWarning: No need to use @SchemaOptions.Merge on "${target.name}", simply use @SchemaOptions.`
				)
				Reflect.defineMetadata(MetaSchemaOptions, options, target)
			}
		}
	}

	/**
	 * Same as {@link SchemaOptions}, but used as an explicit override.
	 * @public
	 */
	export function Override(options: mongoose.SchemaOptions): SchemaOptions.Decorator {
		return (target) => {
			checkDecoratorsOrder(target)

			const parentOrSiblingOptions = getSchemaOptions(target)

			if (!parentOrSiblingOptions) {
				console.warn(
					`RefletMongooseWarning: No need to use @SchemaOptions.Override on "${target.name}", simply use @SchemaOptions.`
				)
			}

			Reflect.defineMetadata(MetaSchemaOptions, options, target)
		}
	}

	/**
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Decorator = ClassDecorator & {
		__mongooseSchemaOptions?: never
	}

	/**
	 * @internal
	 */
	function assignDeep<T extends { [key: string]: any }>(target: T, ...sources: T[]): T {
		if (!sources.length) {
			return target
		}
		const source = sources.shift()

		if (isLitteralObject(target) && isLitteralObject(source)) {
			for (const key in source) {
				if (isLitteralObject(source[key])) {
					if (!target[key]) {
						Object.assign(target, { [key]: {} })
					}
					assignDeep(target[key], source[key])
				} else {
					Object.assign(target, { [key]: source[key] })
				}
			}
		}

		return assignDeep(target, ...sources)
	}

	/**
	 * @internal
	 */
	function isLitteralObject(val: any) {
		return !!val && val.constructor === Object
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
 * class User extends Model.I {
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
export function CreatedAt(target: Object, key: string | symbol): ReturnType<CreatedAt.Decorator> {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.CreatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

export namespace CreatedAt {
	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyDecorator & {
		__mongooseTimestampCreatedAt?: never
	}
}

/**
 * Defines timestamp key directly in the model.
 * @see https://mongoosejs.com/docs/guide#timestamps
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.I {
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
export function UpdatedAt(target: Object, key: string | symbol): ReturnType<UpdatedAt.Decorator> {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.UpdatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

export namespace UpdatedAt {
	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyDecorator & {
		__mongooseTimestampUpdatedAt?: never
	}
}

/**
 * Defines version key directly in the model.
 * @see https://mongoosejs.com/docs/guide#versionKey
 *
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.I {
 *   ＠VersionKey
 *   version: number
 * }
 * ```
 * ---
 * @public
 */
export function VersionKey(target: Object, key: string | symbol): ReturnType<VersionKey.Decorator> {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.VersionKey = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

export namespace VersionKey {
	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator = PropertyDecorator & {
		__mongooseVersionKey?: never
	}
}

/**
 * Checks that options from @SchemaOptions decorator does not overwrite custom keys decorators.
 * Then assign custom keys to schema options.
 * @internal
 */
export function mergeSchemaOptionsAndKeys(target: ClassType): mongoose.SchemaOptions<any> | undefined {
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

/**
 * @internal
 */
function getSchemaOptions(target: Function): mongoose.SchemaOptions | undefined {
	return Reflect.getMetadata(MetaSchemaOptions, target)
}

/**
 * @internal
 */
function getSchemaOptionsKeys(target: Function): SchemaOptionsKeysMeta {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaSchemaOptionsKeys, target))
}
