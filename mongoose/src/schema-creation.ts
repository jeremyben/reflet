import * as mongoose from 'mongoose'
import { getFields, getDiscriminatorFields } from './field-decorators'
import { mergeSchemaOptionsAndKeys } from './schema-options-decorators'
import { applyPreHooks, applyPostHooks } from './hooks-decorators'
import { getKind } from './kind-decorator'
import { applySchemaCallback } from './schema-callback-decorator'
import { attachVirtuals } from './virtual-decorator'
import { RefletMongooseError } from './reflet-error'
import { ClassType, AsDocument } from './interfaces'

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
export function schemaFrom<T extends ClassType>(Class: T): mongoose.Schema<AsDocument<InstanceType<T>>> {
	if (Class.prototype.$isMongooseModelPrototype) {
		return Class.prototype.schema
	}

	return createSchema(Class, { full: true })
}

/**
 * Used directly by `@Model` and `@Model.Discriminator` to avoid the check and bypass of `schemaFrom` method.
 * @param full - for nested schemas of recursive embedded discriminators, to avoid infinite loop.
 * @internal
 */
export function createSchema<T extends ClassType>(target: T, { full }: { full: boolean }) {
	const fields = getFields(target) as mongoose.SchemaDefinition<{}>
	const options = mergeSchemaOptionsAndKeys(target)

	const schema = new mongoose.Schema<AsDocument<InstanceType<T>>>(fields, options)

	attachVirtuals(schema, target)
	loadClassMethods(schema, target)
	applyPreHooks(schema, target)
	applyPostHooks(schema, target)

	// Add embedded discriminators after hooks, like the mongoose documentation recommends.
	if (full) {
		const nestedDiscriminators = attachNestedDiscriminators(schema, target)

		nestedDiscriminators.forEach((nestedSchema, nestedClass) => {
			applySchemaCallback(nestedSchema, nestedClass)
		})

		applySchemaCallback(schema, target)
	}

	// console.log(target.name, schema)

	return schema
}

/**
 * @see https://github.com/Automattic/mongoose/blob/5.9/lib/schema.js#L1944-L1986
 * @internal
 */
function loadClassMethods<T extends mongoose.Document>(schema: mongoose.Schema<T>, target: ClassType): void {
	// If we extend a class decorated by @Model (when we need to use @Model.Discriminator for example),
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

		if (typeof method?.value === 'function') schema.method(methodName, method.value)
		if (typeof method?.get === 'function') schema.virtual(methodName).get(method.get)
		if (typeof method?.set === 'function') schema.virtual(methodName).set(method.set)
	}
}

/**
 * @internal
 */
function attachNestedDiscriminators<T extends mongoose.Document>(
	parentSchema: mongoose.Schema<T>,
	parentClass: ClassType,
	nestedDiscriminators: Map<ClassType, mongoose.Schema> = new Map()
): Map<ClassType, mongoose.Schema> {
	// https://mongoosejs.com/docs/discriminators#single-nested-discriminators
	// https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays

	const discriminatorFields = getDiscriminatorFields(parentClass)

	for (const key in discriminatorFields) {
		/* istanbul ignore if - routine check */
		if (!discriminatorFields.hasOwnProperty(key)) continue

		const nestedClasses = discriminatorFields[key].classes
		const options = discriminatorFields[key].options
		const nestedPath = parentSchema.path(key) as NestedPath

		if (options?.required) {
			nestedPath.required(true)
		}

		// First go through all the discriminators to set the discriminatorKey
		// and make sure on the next loop that everyone of them has the same.
		const discriminatorKey = setNestedDiscriminatorKey(nestedPath, nestedClasses, options?.strict)

		for (const nestedClass of nestedClasses) {
			const [kindKey, kindValue] = getKind(nestedClass)

			// Checks that sibling discriminators have the same @Kind key.
			if (kindKey && discriminatorKey !== kindKey) {
				throw new RefletMongooseError(
					'DISCRIMINATOR_KEY_CONFLICT',
					`Embedded discriminator "${parentClass.name}" must have @Kind (or @DiscriminatorKey) named "${discriminatorKey}", like its sibling embedded discriminator(s).`
				)
			}

			// If `strict: true`, enforce kind value with an enum.
			if (options?.strict) {
				const discriminatorKeyPath = nestedPath.schema.path(discriminatorKey) as NestedPath
				discriminatorKeyPath.enum(kindValue || nestedClass.name)
			}

			const existingNestedSchema = nestedDiscriminators.get(nestedClass)

			if (existingNestedSchema) {
				nestedPath.discriminator(nestedClass.name, existingNestedSchema, kindValue)
			} else {
				// User might have decorated the nested schema with `@Model`.
				const nestedSchema = nestedClass.prototype.$isMongooseModelPrototype
					? nestedClass.prototype.schema
					: createSchema(nestedClass, { full: false })

				nestedDiscriminators.set(nestedClass, nestedSchema)
				nestedPath.discriminator(nestedClass.name, nestedSchema, kindValue)

				attachNestedDiscriminators(nestedSchema, nestedClass, nestedDiscriminators)
			}
		}
	}

	return nestedDiscriminators
}

/**
 * @internal
 */
function setNestedDiscriminatorKey(nestedPath: NestedPath, nestedClasses: ClassType[], strict: boolean | undefined) {
	let discriminatorKey: string | undefined

	for (const subClass of nestedClasses) {
		const [kindKey] = getKind(subClass)

		// Assign the key on the nested path and keep reference of @Kind key, only once.
		if (kindKey && !discriminatorKey) {
			discriminatorKey = kindKey
			nestedPath.schema.add({ [kindKey]: { type: String, required: strict } })
			nestedPath.schema.set('discriminatorKey', kindKey)
		}
	}

	// If none of the siblings has a @Kind key, the discriminatorKey is the default one.
	if (!discriminatorKey) {
		discriminatorKey = '__t'
		nestedPath.schema.add({ __t: { type: String, required: strict } })
	}

	return discriminatorKey
}

/**
 * @internal
 */
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
