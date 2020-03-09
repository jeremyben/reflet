import Mongoose from 'mongoose'
import { getFields } from './field-decorator'
import { getSchemaOptions, getSchemaCallback } from './schema-options-decorators'
import { getSchemaKeys } from './schema-keys-decorators'
import { getPreHooks } from './hooks-decorators'
import { ConstructorType, ConstructorInstance } from './interfaces'
import { getFieldDiscriminators } from './field-discriminator-decorator'

/**
 * Creates a schema from a decorated class.
 *
 * @see https://mongoosejs.com/docs/guide.html#definition
 * @see https://mongoosejs.com/docs/api.html#schema_Schema-loadClass
 *
 * @example
 * ```ts
 * ＠SchemaOptions({ _id: false })
 * class Person {
 *   ＠Field({ type: String })
 *   firstname: string
 *
 *   ＠Field({ type: String })
 *   lastname: string
 *
 *   get fullname() {
 *     return `${this.firstname} ${this.lastname}`
 *   }
 * }
 *
 * const personSchema = schemaFrom(Person)
 * ```
 * ---
 * @public
 */
export function schemaFrom<T extends ConstructorType>(target: T) {
	if (target.prototype.$isMongooseModelPrototype) {
		return target.prototype.schema as Mongoose.Schema<ConstructorInstance<T>>
	}

	return createSchema(target)
}

/**
 * Used directly by `@Model` and `@Model.Discriminator` to avoid the check and bypass of `schemaFrom` method.
 * @private
 */
export function createSchema<T extends ConstructorType>(target: T) {
	const fields = getFields(target)
	const fieldDiscriminators = getFieldDiscriminators(target)
	const options = mergeSchemaKeysAndOptions(target)
	const preHooks = getPreHooks(target)
	const schemaCallback = getSchemaCallback(target)

	const schema = new Mongoose.Schema<ConstructorInstance<T>>(fields, options)

	loadClassMethods(schema, target)

	for (const key in fieldDiscriminators) {
		if (!fieldDiscriminators.hasOwnProperty(key)) continue
		const subSchemaClasses = fieldDiscriminators[key]

		// https://mongoosejs.com/docs/discriminators.html#embedded-discriminators-in-arrays
		const baseSubSchema = new Mongoose.Schema({
			[key]: [new Mongoose.Schema({}, { discriminatorKey: 'kind', _id: false })],
		})
		schema.add(baseSubSchema, key)

		for (const subSchemaClass of subSchemaClasses) {
			// User might have decorated the subSchema with `@Model`,
			// so we use `schemaFrom` in order to avoid errors.
			const subSchema = schemaFrom(subSchemaClass)
			schema.path(key).discriminator(subSchemaClass.name, subSchema)
		}
	}

	for (const preHook of preHooks) {
		schema.pre(preHook.method, preHook.fn as any)
	}

	if (typeof schemaCallback === 'function') {
		schemaCallback(schema)
	}

	// console.log(target.name, schema)

	return schema
}

/**
 * Checks that options from @SchemaOptions decorator does not overwrite custom keys decorators,
 * then assign custom keys to schema options.
 * @private
 */
function mergeSchemaKeysAndOptions(target: ConstructorType): Mongoose.SchemaOptions | undefined {
	let options = getSchemaOptions(target)
	const keys = getSchemaKeys(target)

	if (!!keys.CreatedAtKey || !!keys.UpdatedAtKey) {
		options = options || {}
		const { timestamps } = options

		const createdAtError = `${target.name} Schema: Cannot overwrite @CreatedAtKey decorator with different 'timestamps' schema option.`
		const updatedAtError = `${target.name} Schema: Cannot overwrite @UpdatedAtKey decorator with different 'timestamps' schema option.`

		if (timestamps === true) {
			if (keys.CreatedAtKey !== 'createdAt') throw Error(createdAtError)
			if (keys.UpdatedAtKey !== 'updatedAt') throw Error(updatedAtError)
		}

		if (timestamps === false) {
			if (!!keys.CreatedAtKey) throw Error(createdAtError)
			if (!!keys.UpdatedAtKey) throw Error(updatedAtError)
		}

		if (!!timestamps && typeof timestamps === 'object') {
			if (keys.CreatedAtKey !== timestamps.createdAt) throw Error(createdAtError)
			if (keys.UpdatedAtKey !== timestamps.updatedAt) throw Error(updatedAtError)
		}

		options.timestamps = {
			createdAt: keys.CreatedAtKey || false,
			updatedAt: keys.UpdatedAtKey || false,
		}
	}

	if (!!keys.VersionKey) {
		options = options || {}
		const { versionKey } = options

		const versionKeyError = `${target.name} Schema: Cannot overwrite @VersionKey decorator with different 'versionKey' schema option.`

		if (versionKey === false) throw Error(versionKeyError)
		if (typeof versionKey === 'string' && versionKey !== keys.VersionKey) throw Error(versionKeyError)

		options.versionKey = keys.VersionKey
	}

	if (!!keys.DiscriminatorKey) {
		options = options || {}
		const { discriminatorKey } = options

		const discriminatorKeyError = `${target.name} Schema: Cannot overwrite @DiscriminatorKey decorator with different 'discriminatorKey' schema option.`

		if (typeof discriminatorKey === 'string' && discriminatorKey !== keys.DiscriminatorKey) {
			throw Error(discriminatorKeyError)
		}

		options.discriminatorKey = keys.DiscriminatorKey
	}

	return options
}

/**
 * @see https://github.com/Automattic/mongoose/blob/5.9/lib/schema.js#L1944-L1986
 * @private
 */
function loadClassMethods<T>(schema: Mongoose.Schema<T>, target: ConstructorType): void {
	// If we extend a class decorated by @Model (when we need to use @ModelDiscriminator for example),
	// its protototype is gonna be a mongoose model and have `$isMongooseModelPrototype` property.
	// If it's the case, we can't attach methods, statics, or virtuals from its parent, because
	// we would get errors like 'Virtual path "_id" conflicts with a real path in the schema'.
	// https://github.com/Automattic/mongoose/issues/4942
	const parent = Object.getPrototypeOf(target)
	if (parent !== Object.prototype && parent !== Function.prototype && !parent.prototype.$isMongooseModelPrototype) {
		loadClassMethods(schema, parent)
	}

	// Add static methods.
	for (const name of Object.getOwnPropertyNames(target)) {
		if (name.match(/^(length|name|prototype)$/)) continue

		const method = Object.getOwnPropertyDescriptor(target, name)

		if (typeof method?.value === 'function') schema.static(name, method.value)
	}

	// Add methods and virtuals.
	for (const methodName of Object.getOwnPropertyNames(target.prototype)) {
		if (methodName.match(/^(constructor)$/)) continue

		const method = Object.getOwnPropertyDescriptor(target.prototype, methodName)

		if (typeof method?.value === 'function') schema.method(methodName as keyof T, method.value)
		if (typeof method?.get === 'function') schema.virtual(methodName).get(method.get)
		if (typeof method?.set === 'function') schema.virtual(methodName).set(method.set)
	}
}
