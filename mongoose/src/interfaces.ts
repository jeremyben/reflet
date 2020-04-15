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
	 * Used for `@Pre` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Pre = ClassDecorator & {
		__mongoosePre?: never
	}

	/**
	 * Used for `@Post` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type Post = ClassDecorator & {
		__mongoosePost?: never
	}

	/**
	 * Used for `@Field` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Field = PropertyDecorator & {
		__mongooseField?: never
	}

	/**
	 * Used for `@Field.Nested` decorator.
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
 * Omits Mongoose properties and all methods.
 *
 * Helps with the return type of `toObject()` and `toJson()`.
 *
 * @example
 * ```ts
 * const userObject = userDocument.toObject() as Plain<User>
 * ```
 * @public
 */
export type Plain<T> = Pick<
	T,
	Exclude<
		{
			[K in keyof T]: K extends Exclude<keyof mongoose.Document, '_id'>
				? never
				: T[K] extends Function
				? never
				: K
		}[keyof T],
		undefined
	>
>

export namespace Plain {
	/**
	 * Omits Mongoose properties, all methods, and custom keys.
	 *
	 * Helps with the constructor parameter type of `@Model` decorated classes.
	 *
	 * @example
	 * ```ts
	 * ＠Model()
	 * class User extends Model.Interface {
	 *   ＠Field({ type: String })
	 *   name: string
	 *
	 *   get greet() {
	 *     return 'hello ' + this.name
	 *   }
	 *
	 *   constructor(doc: Plain.Without<User, '_id' | 'greet'>) {
	 *     super()
	 *   }
	 * }
	 *
	 * const user = await new User({ name: 'Jeremy' }).save()
	 * ```
	 * @public
	 */
	export type Without<T, U extends keyof T> = Omit<Plain<T>, U>
	/**
	 * Omits Mongoose properties and all methods, and makes remaining properties optional.
	 *
	 * Helps with the constructor parameter type of `@Model` decorated classes.
	 *
	 * @public
	 */
	export type Partial<T> = Partial_<Plain<T>>
}

/**
 * @public
 */
type MethodKeys<T> = { [P in keyof T]: T[P] extends Function ? P : never }[keyof T]

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
type Partial_<T> = Partial<T>

// tslint:disable: no-empty-interface
declare global {
	/**
	 * Namespace dedicated to application-specific declaration merging.
	 * @public
	 */
	namespace RefletMongoose {
		/**
		 * Open interface to extend `@Field` SchemaType options. Useful for plugins.
		 * @public
		 */
		interface SchemaTypeOptions {}

		/**
		 * Open interface to enforce an union of model names in `ref` SchemaType option.
		 * @public
		 */
		interface Ref {}
	}
}

declare module 'mongoose' {
	interface MongooseDocument {
		populate<T extends this & Document>(path: keyof Plain<T>, callback?: (err: any, res: this) => void): this
		populate<T extends this & Document>(
			path: keyof Plain<T>,
			names: string,
			callback?: (err: any, res: this) => void
		): this

		deleteOne(): Promise<this & Document>
	}
}
