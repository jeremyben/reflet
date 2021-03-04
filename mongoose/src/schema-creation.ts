import * as mongoose from 'mongoose'
import { getFields, getDiscriminatorFields, getDiscriminatorArrayFields } from './field-decorators'
import { mergeSchemaOptionsAndKeys } from './schema-options-decorators'
import { applyPreHooks, applyPostHooks } from './hooks-decorators'
import { getKind } from './kind-decorator'
import { applySchemaCallback } from './schema-callback-decorator'
import { attachPopulateVirtuals } from './virtual-populate-decorator'
import { ConstructorType, ConstructorInstance } from './interfaces'

/**
 * Retrieves the schema from a decorated class.
 *
 * @see https://mongoosejs.com/docs/guide#definition
 * @see https://mongoosejs.com/docs/api#schema_Schema-loadClass
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
export function schemaFrom<T extends ConstructorType>(Class: T): mongoose.Schema<ConstructorInstance<T>> {
	if (Class.prototype.$isMongooseModelPrototype) {
		return Class.prototype.schema
	}

	return createSchema(Class)
}

/**
 * Used directly by `@Model` and `@Model.Discriminator` to avoid the check and bypass of `schemaFrom` method.
 * @internal
 */
export function createSchema<T extends ConstructorType>(Class: T) {
	const fields = getFields(Class)
	const options = mergeSchemaOptionsAndKeys(Class)

	const schema = new mongoose.Schema<ConstructorInstance<T>>(fields, options)

	attachPopulateVirtuals(schema, Class)
	loadClassMethods(schema, Class)
	applyPreHooks(schema, Class)
	applyPostHooks(schema, Class)

	// Add embedded discriminators after hooks, like the mongoose documentation recommends.
	loadDiscriminatorsFields(schema, Class)

	applySchemaCallback(schema, Class)

	// console.log(Class.name, schema)

	return schema
}

/**
 * @see https://github.com/Automattic/mongoose/blob/5.9/lib/schema.js#L1944-L1986
 * @internal
 */
function loadClassMethods<T>(schema: mongoose.Schema<T>, Class: ConstructorType): void {
	// If we extend a class decorated by @Model (when we need to use @Model.Discriminator for example),
	// its protototype is gonna be a mongoose model and have `$isMongooseModelPrototype` property.
	// If it's the case, we can't attach methods, statics, or virtuals from its parent, because
	// we would get errors like 'Virtual path "_id" conflicts with a real path in the schema'.
	// https://github.com/Automattic/mongoose/issues/4942
	const parent = Object.getPrototypeOf(Class)
	if (parent !== Object.prototype && parent !== Function.prototype && !parent.prototype.$isMongooseModelPrototype) {
		loadClassMethods(schema, parent)
	}

	// Add static methods.
	for (const name of Object.getOwnPropertyNames(Class)) {
		if (name.match(/^(length|name|prototype)$/)) continue

		const method = Object.getOwnPropertyDescriptor(Class, name)

		if (typeof method?.value === 'function') schema.static(name, method.value)
	}

	// Add methods and virtuals.
	for (const methodName of Object.getOwnPropertyNames(Class.prototype)) {
		if (methodName.match(/^(constructor)$/)) continue

		const method = Object.getOwnPropertyDescriptor(Class.prototype, methodName)

		if (typeof method?.value === 'function') schema.method(methodName as keyof T, method.value)
		if (typeof method?.get === 'function') schema.virtual(methodName).get(method.get)
		if (typeof method?.set === 'function') schema.virtual(methodName).set(method.set)
	}
}

/**
 * @internal
 */
function loadDiscriminatorsFields<T>(schema: mongoose.Schema<T>, Class: ConstructorType) {
	// https://mongoosejs.com/docs/discriminators#single-nested-discriminators
	attachToSchema(getDiscriminatorFields(Class))

	// https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
	attachToSchema(getDiscriminatorArrayFields(Class), { asArray: true })

	function attachToSchema(discriminatorFields: ReturnType<typeof getDiscriminatorFields>, { asArray = false } = {}) {
		for (const key in discriminatorFields) {
			/* istanbul ignore if - routine check */
			if (!discriminatorFields.hasOwnProperty(key)) continue

			const subClasses = discriminatorFields[key].classes
			const options = discriminatorFields[key].options

			// We must remove _id from the base schema or `{ _id: false }` won't do anything on the discriminator schema (_id is still there by default).
			const baseSubSchema = new mongoose.Schema({}, { _id: false })
			schema.add({ [key]: asArray ? [baseSubSchema] : baseSubSchema })

			const baseSubSchemaPath = schema.path(key) as NestedPath

			if (options?.required) {
				baseSubSchemaPath.required(true)
			}

			let discriminatorKey: string | undefined

			// First go through all the discriminators to set the discriminatorKey
			// and make sure on the next loop that everyone of them has the same.
			for (const subClass of subClasses) {
				const [kindKey] = getKind(subClass)

				// Assign the key on the nested path and keep reference of @Kind key, only once.
				if (kindKey && !discriminatorKey) {
					discriminatorKey = kindKey
					baseSubSchemaPath.schema.add({ [kindKey]: { type: String, required: options?.strict } })
					baseSubSchemaPath.schema.set('discriminatorKey', kindKey)
				}
			}

			// If none of the siblings has a @Kind key, the discriminatorKey is the default one.
			if (!discriminatorKey) {
				discriminatorKey = '__t'
				baseSubSchemaPath.schema.add({ __t: { type: String, required: options?.strict } })
			}

			for (const subClass of subClasses) {
				const [kindKey, kindValue] = getKind(subClass)

				// Checks that sibling discriminators have the same @Kind key.
				if (kindKey && discriminatorKey !== kindKey) {
					throw Error(
						`Embedded discriminator "${Class.name}" must have @Kind named "${discriminatorKey}", like its sibling embedded discriminator(s).`
					)
				}

				if (options?.strict) {
					const discriminatorKeyPath = baseSubSchemaPath.schema.path(discriminatorKey) as NestedPath
					discriminatorKeyPath.enum(kindValue || subClass.name)
				}

				// User might have decorated the subSchema with `@Model`, so we use `schemaFrom` in order to avoid errors.
				const subSchema = schemaFrom(subClass)
				baseSubSchemaPath.discriminator(subClass.name, subSchema, kindValue)
			}
		}
	}

	type NestedPath = mongoose.SchemaType & {
		discriminator(name: string, schema: mongoose.Schema, value?: string): void
		enum(value: string | number): void
		enumValues: string[] | number[]
		schema: mongoose.Schema & {
			discriminators?: {
				[key: string]: mongoose.Schema & {
					discriminatorMapping?: { key: string; value: string; isRoot: boolean }
				}
			}
		}
	}
}
