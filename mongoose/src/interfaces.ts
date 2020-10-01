import * as mongoose from 'mongoose'

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
	export type Model<T extends ConstructorType> = ((target: T) => any) & {
		__mongooseModel?: never
	}

	/**
	 * Used for `@Model.Discriminator` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type ModelDiscriminator<T extends ConstructorType> = ((target: T) => any) & {
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
	 * Used for `@PreHook` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type PreHook = ClassDecorator & {
		__mongoosePreHook?: never
	}

	/**
	 * Used for `@PostHook` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type PostHook = ClassDecorator & {
		__mongoosePostHook?: never
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

	/**
	 * Used for `@PopulateVirtual` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Virtual = PropertyDecorator & {
		__mongooseVirtual?: never
	}
}

/**
 * @public
 */
type PlainKeys<T> = {
	[K in keyof T]: K extends '_id' ? K : K extends keyof mongoose.Document ? never : T[K] extends Function ? never : K
}[keyof T]

/**
 * Recursive.
 * @public
 */
type Plain_<T> = {
	[K in PlainKeys<T>]: T[K] extends mongoose.Document
		? Plain_<T[K]>
		: T[K] extends (infer U & mongoose.Document)[] // Must also constraint to mongoose.document to avoid problems with regular arrays
		? Plain_<U>[]
		: T[K]
}

/**
 * Omits Mongoose properties (except `_id`) and all methods.
 *
 * @template T - mongoose document.
 * @template O - options to omit and/or make optional other keys.
 *
 * @example
 * ```ts
 * ＠Model()
 * class User extends Model.I {
 *   ＠Field(String)
 *   name: string
 *
 *   get greet() {
 *     return 'hello ' + this.name
 *   }
 *
 *   constructor(doc: Plain<User, { Omit: 'greet', Optional: '_id' }>) {
 *     super()
 *   }
 * }
 *
 * const user = await new User({ name: 'Jeremy' }).save()
 *
 * const userObject = user.toObject() as Plain<User, { Omit: 'greet' }>
 * ```
 * ---
 * @public
 */
export type Plain<T, O extends { Omit?: PlainKeys<T>; Optional?: PlainKeys<T> } | void = void> = O extends {
	[key: string]: any
}
	? Omit<
			Plain_<T>,
			(O['Omit'] extends string ? O['Omit'] : never) | (O['Optional'] extends string ? O['Optional'] : never)
	  > &
			Pick<Partial<T>, O['Optional'] extends string ? O['Optional'] : never>
	: Plain_<T>

export namespace Plain {
	/**
	 * Omits Mongoose properties, all methods, and custom keys.
	 * @template T - mongoose document.
	 * @template K - other keys to omit.
	 * @public
	 */
	export type Omit<T, K extends PlainKeys<T>> = Plain<T, { Omit: K }>

	/**
	 * Omits Mongoose properties, all methods, and custom keys.
	 * @deprecated use `Plain.Omit`
	 * @public
	 */
	export type Without<T, K extends PlainKeys<T>> = Plain<T, { Omit: K }>

	/**
	 * Omits Mongoose properties, all methods, and makes custom keys optional.
	 * @template T - mongoose document.
	 * @template K - other keys to make optional.
	 * @public
	 */
	export type Optional<T, K extends PlainKeys<T>> = Plain<T, { Optional: K }>

	/**
	 * Omits Mongoose properties and all methods, and makes remaining keys optional.
	 * @template T - mongoose document.
	 * @public
	 */
	export type Partial<T> = globalThis.Partial<Plain_<T>>
}

/**
 * Interface with the right keys but with `any` types, so we can enforce decorated classes to a minimal interface,
 * and we can overwrite the methods' signatures without worrying about an update of `@types/mongoose` breaking our types.
 * @public
 */
export type ModelAny = { [K in keyof mongoose.Model<mongoose.Document>]: any } &
	(new (...args: any[]) => { [K in keyof mongoose.Document]: any })

/**
 * @public
 */
export type ConstructorType<T = any> = Function & { prototype: T }

/**
 * @public
 */
export type ConstructorInstance<T extends ConstructorType> = T extends Function & { prototype: infer R } ? R : never

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

declare module 'mongoose' {} // keep it for now (issue in declaration bundling)
