import mongoose from 'mongoose'
import { getFields, getDiscriminatorFields, getDiscriminatorArrayFields } from './field-decorators'
import { mergeSchemaOptionsAndKeys } from './schema-options-decorators'
import { getPreHooks, getPostHooks } from './hooks-decorators'
import { getKind } from './kind-decorator'
import { getSchemaCallback } from './schema-callback-decorator'
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
	const preHooks = getPreHooks(Class)
	const postHooks = getPostHooks(Class)
	const schemaCallback = getSchemaCallback(Class)

	const schema = new mongoose.Schema<ConstructorInstance<T>>(fields, options)

	loadClassMethods(schema, Class)

	for (const preHook of preHooks) {
		;(schema.pre as Function)(preHook.method, preHook.callbackOrOptions, preHook.callbackIfOptions)
	}

	for (const postHook of postHooks) {
		;(schema.post as Function)(postHook.method, postHook.callbackOrOptions, postHook.callbackIfOptions)
	}

	// Add embedded discriminators after hooks, like the mongoose documentation recommends.
	loadDiscriminatorsFields(schema, Class)

	if (typeof schemaCallback === 'function') {
		schemaCallback(schema)
	}

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
	const singleFields = getDiscriminatorFields(Class)
	attachToSchema(singleFields)

	// https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
	const arrayFields = getDiscriminatorArrayFields(Class)
	attachToSchema(arrayFields, { asArray: true })

	function attachToSchema(d11rFields: { [key: string]: ConstructorType[] }, { asArray = false } = {}) {
		for (const key in d11rFields) {
			/* istanbul ignore if - routine check */
			if (!d11rFields.hasOwnProperty(key)) continue
			const nestedSchemaClasses = d11rFields[key]

			const baseSchemaForD11rs = new mongoose.Schema({}, { _id: false })
			schema.add({ [key]: asArray ? [baseSchemaForD11rs] : baseSchemaForD11rs })

			const nestedPath = schema.path(key) as NestedPath

			let alreadyProvidedKindKey: string | undefined

			// First go through all the discriminators to set the discriminatorKey
			// and make sure on the next loop that everyone of them has the same.
			for (const nestedSchemaClass of nestedSchemaClasses) {
				const [kindKey] = getKind(nestedSchemaClass)

				// Assign the key on the nested path and keep reference of @Kind key, only once.
				if (kindKey && !alreadyProvidedKindKey) {
					alreadyProvidedKindKey = kindKey
					nestedPath.schema.set('discriminatorKey', kindKey)
				}
			}

			for (const nestedSchemaClass of nestedSchemaClasses) {
				const [kindKey, kindValue] = getKind(nestedSchemaClass)

				// Checks that sibling discriminators have the same @Kind key.
				if (
					(alreadyProvidedKindKey && !kindKey) ||
					(alreadyProvidedKindKey && kindKey && alreadyProvidedKindKey !== kindKey)
				) {
					throw Error(
						`Embedded discriminator "${Class.name}" must have @Kind named "${alreadyProvidedKindKey}", like its sibling embedded discriminator(s).`
					)
				}

				// User might have decorated the subSchema with `@Model`, so we use `schemaFrom` in order to avoid errors.
				const nestedSchema = schemaFrom(nestedSchemaClass)
				nestedPath.discriminator(nestedSchemaClass.name, nestedSchema, kindValue)
			}
		}
	}

	type NestedPath = mongoose.SchemaType & {
		discriminator(name: string, schema: mongoose.Schema, value?: string): void
		schema: mongoose.Schema & {
			discriminators?: {
				[key: string]: mongoose.Schema & {
					discriminatorMapping?: { key: string; value: string; isRoot: boolean }
				}
			}
		}
	}
}
