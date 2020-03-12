import mongoose from 'mongoose'

/**
 * Exported decorators interfaces.
 * Branded as distinct symbols for the dedicated linter and the compiler API.
 * @public
 */
export namespace Decorator {
	/**
	 * Used for `@Model` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Model<T extends mongoose.Model<mongoose.Document>> = ((target: T) => any) & {
		__mongooseModel?: never
	}

	/**
	 * Used for `@Model.Discriminator` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type ModelDiscriminator<T extends mongoose.Model<mongoose.Document>> = ((target: T) => any) & {
		__mongooseModelDiscriminator?: never
	}

	/**
	 * Used for `@SchemaOptions` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type SchemaOptions = ClassDecorator & {
		__mongooseSchemaOptions?: never
	}

	/**
	 * Used for `@SchemaCallback` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type SchemaCallback = ClassDecorator & {
		__mongooseSchemaCallback?: never
	}

	/**
	 * Used for `@Field` decorators.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Field = PropertyDecorator & {
		__mongooseField?: never
	}

	/**
	 * Used for `@Field` decorators.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type FieldNested = PropertyDecorator & {
		__mongooseFieldNested?: never
	}

	/**
	 * Used for `@Field.Union` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type FieldUnion = PropertyDecorator & {
		__mongooseFieldUnion?: never
	}

	/**
	 * Used for `@Field.ArrayOfUnion` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type FieldArrayOfUnion = PropertyDecorator & {
		__mongooseFieldArrayOfUnion?: never
	}

	/**
	 * Used for `@Kind` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Kind = PropertyDecorator & {
		__mongooseKind?: never
	}
}

/**
 * Helps with constructor typing of `@Model` decorated classes.
 *
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.Interface {
 *   ＠Field({ type: String, required: true })
 *   name: string
 *
 *   constructor(doc?: NewDoc<User>) {
 *     super()
 *   }
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 * ```
 * @public
 */
export type NewDoc<T extends mongoose.Document> = Omit<Partial<T>, keyof mongoose.Document | MethodKeys<T>>

/**
 * @public
 */
export type ConstructorType<T = any> = Function & { prototype: T }

/**
 * @public
 */
export type ConstructorInstance<T extends ConstructorType> = T extends Function & { prototype: infer R } ? R : never

/**
 * @public
 */
type MethodKeys<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

declare module 'mongoose' {
	export interface Schema {
		_userProvidedOptions: SchemaOptions
	}

	export interface MongooseDocument {
		populate<T extends this & Document>(path: keyof NewDoc<T>, callback?: (err: any, res: this) => void): this
		populate<T extends this & Document>(
			path: keyof NewDoc<T>,
			names: string,
			callback?: (err: any, res: this) => void
		): this
	}
}
