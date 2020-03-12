import mongoose from 'mongoose'
import { ConstructorType, Decorator } from './interfaces'

const MetaSchemaOptions = Symbol('schema-options')
const MetaSchemaOptionsKeys = Symbol('schema-options-keys')

/**
 * Defines schema options.
 * @see https://mongoosejs.com/docs/guide#options
 * @example
 * ```ts
 * ＠SchemaOptions({ autoIndex: false })
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
		Reflect.defineMetadata(MetaSchemaOptions, options, Class)
	}
}

/**
 * @internal
 */
type SchemaOptionsKeysMeta = Partial<{
	CreatedAt: string
	UpdatedAt: string
	DiscriminatorKey: string
	VersionKey: string
}>

/**
 * @see https://mongoosejs.com/docs/guide#timestamps
 * @public
 */
export const CreatedAt: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.CreatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/guide#timestamps
 * @public
 */
export const UpdatedAt: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.UpdatedAt = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/discriminators#discriminator-keys
 * @public
 */
export const DiscriminatorKey: PropertyDecorator = (target, key) => {
	const schemaKeys = getSchemaOptionsKeys(target.constructor)
	schemaKeys.DiscriminatorKey = key as string
	Reflect.defineMetadata(MetaSchemaOptionsKeys, schemaKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/guide#versionKey
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
		const { timestamps } = options

		const createdAtError = `Schema "${Class.name}" cannot overwrite @CreatedAtKey "${
			keys.CreatedAt
		}" with different schema option "timestamps: ${JSON.stringify(timestamps)}".`

		const updatedAtError = `Schema "${Class.name}" cannot overwrite @UpdatedAtKey "${
			keys.UpdatedAt
		}" with different schema option "timestamps: ${JSON.stringify(timestamps)}".`

		if (timestamps === true) {
			if (keys.CreatedAt !== 'createdAt') throw Error(createdAtError)
			if (keys.UpdatedAt !== 'updatedAt') throw Error(updatedAtError)
		}

		if (timestamps === false) {
			if (!!keys.CreatedAt) throw Error(createdAtError)
			if (!!keys.UpdatedAt) throw Error(updatedAtError)
		}

		if (!!timestamps && typeof timestamps === 'object') {
			if (keys.CreatedAt !== timestamps.createdAt) throw Error(createdAtError)
			if (keys.UpdatedAt !== timestamps.updatedAt) throw Error(updatedAtError)
		}

		options.timestamps = {
			createdAt: keys.CreatedAt || false,
			updatedAt: keys.UpdatedAt || false,
		}
	}

	if (!!keys.VersionKey) {
		options = options || {}
		const { versionKey } = options

		const versionKeyError = `Schema "${Class.name}" cannot overwrite @VersionKey "${keys.VersionKey}" with different schema option "versionKey: ${versionKey}".`

		if (versionKey === false) throw Error(versionKeyError)
		if (typeof versionKey === 'string' && versionKey !== keys.VersionKey) throw Error(versionKeyError)

		options.versionKey = keys.VersionKey
	}

	if (!!keys.DiscriminatorKey) {
		options = options || {}
		const { discriminatorKey } = options

		const discriminatorKeyError = `Schema "${Class.name}" cannot overwrite @DiscriminatorKey "${keys.DiscriminatorKey}" with different schema option "discriminatorKey: ${discriminatorKey}".`

		if (typeof discriminatorKey === 'string' && discriminatorKey !== keys.DiscriminatorKey) {
			throw Error(discriminatorKeyError)
		}

		options.discriminatorKey = keys.DiscriminatorKey
	}

	return options
}
