/**
 * @private
 */
const MetaSchemaKeys = Symbol('schema-keys')

/**
 * @private
 */
type SchemaKeys = Partial<{
	CreatedAtKey: string
	UpdatedAtKey: string
	DiscriminatorKey: string
	VersionKey: string
}>

/**
 * @see https://mongoosejs.com/docs/guide.html#timestamps
 * @public
 */
export const CreatedAtKey: PropertyDecorator = (target, key) => {
	const customKeys = getSchemaKeys(target.constructor)
	customKeys.CreatedAtKey = key as string
	Reflect.defineMetadata(MetaSchemaKeys, customKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/guide.html#timestamps
 * @public
 */
export const UpdatedAtKey: PropertyDecorator = (target, key) => {
	const customKeys = getSchemaKeys(target.constructor)
	customKeys.UpdatedAtKey = key as string
	Reflect.defineMetadata(MetaSchemaKeys, customKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/discriminators.html#discriminator-keys
 * @public
 */
export const DiscriminatorKey: PropertyDecorator = (target, key) => {
	const customKeys = getSchemaKeys(target.constructor)
	customKeys.DiscriminatorKey = key as string
	Reflect.defineMetadata(MetaSchemaKeys, customKeys, target.constructor)
}

/**
 * @see https://mongoosejs.com/docs/guide.html#versionKey
 * @public
 */
export const VersionKey: PropertyDecorator = (target, key) => {
	const customKeys = getSchemaKeys(target.constructor)
	customKeys.VersionKey = key as string
	Reflect.defineMetadata(MetaSchemaKeys, customKeys, target.constructor)
}

/**
 * @private
 */
export function getSchemaKeys(target: object): SchemaKeys {
	// Clone the object to avoid inheritance issues like
	// https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaSchemaKeys, target))
}
