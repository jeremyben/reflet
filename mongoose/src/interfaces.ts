import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb'

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
	export type Model<T extends ClassType> = ((target: T) => any) & {
		__mongooseModel?: never
	}

	/**
	 * Used for `@Model.Discriminator` decorator.
	 * Equivalent to `ClassDecorator`.
	 * @public
	 */
	export type ModelDiscriminator<T extends ClassType> = ((target: T) => any) & {
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
	 * Used for `@Field.Schema` decorator.
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type FieldSchema = PropertyDecorator & {
		__mongooseFieldSchema?: never
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

// tslint:disable: no-shadowed-variable

/**
 * @public
 */
type EnsureString<T> = T extends string ? T : never

/**
 * @public
 */
type PrimitiveOrBuiltIn =
	| number
	| boolean
	| string
	| symbol
	| null
	| bigint
	| BigInt
	| Date
	| RegExp
	| Buffer
	| mongoose.Types.ObjectId
	| mongoose.Types.Decimal128
	| mongodb.Binary

/**
 * @public
 */
// https://stackoverflow.com/a/49936686/4776628
type _PartialDeep<T> = {
	[P in keyof T]?: T[P] extends PrimitiveOrBuiltIn[] | PrimitiveOrBuiltIn[][]
		? T[P]
		: T[P] extends (infer U)[]
		? _PartialDeep<U>[]
		: T[P] extends Map<infer K, infer V>
		? Map<K, _PartialDeep<V>>
		: T[P] extends PrimitiveOrBuiltIn
		? T[P]
		: _PartialDeep<T[P]>
}

/**
 * @public
 */
type _AllowString<T> = {
	[K in keyof T]: [Extract<T[K], mongodb.ObjectId>] extends [never]
		? T[K] extends PrimitiveOrBuiltIn
			? T[K]
			: _AllowString<T[K]>
		: T[K] | string
}

/**
 * @public
 */
type PlainKeys<T> = {
	[K in keyof T]: K extends '_id' ? K : K extends keyof mongoose.Document ? never : T[K] extends Function ? never : K
}[keyof T]

/**
 * @public
 */
type _Plain<T> = mongoose.LeanDocument<{
	[P in PlainKeys<T>]: T[P]
}>

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
	? Omit<_Plain<T>, EnsureString<O['Omit']> | EnsureString<O['Optional']>> &
			(O['Optional'] extends string ? Pick<Partial<T>, O['Optional']> : {})
	: _Plain<T>

export namespace Plain {
	/**
	 * Omits Mongoose properties, all methods, and custom keys.
	 * @template T - mongoose document.
	 * @template K - other keys to omit.
	 * @public
	 */
	export type Omit<T, K extends PlainKeys<T>> = Plain<T, { Omit: K }>

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
	export type Partial<T> = globalThis.Partial<_Plain<T>>

	/**
	 * Omits Mongoose properties and all methods, and makes remaining keys optional, recursively.
	 * @template T - mongoose document.
	 * @public
	 */
	export type PartialDeep<T> = _PartialDeep<_Plain<T>>

	/**
	 * Omits Mongoose properties (except `_id`) and all methods.
	 *
	 * **Allows `string` for ObjectIds.**
	 *
	 * @template T - mongoose document.
	 * @template O - options to omit and/or make optional other keys.
	 */
	export type AllowString<T, O extends { Omit?: PlainKeys<T>; Optional?: PlainKeys<T> } | void = void> = _AllowString<
		Plain<T, O>
	>

	export namespace AllowString {
		/**
		 * Omits Mongoose properties, all methods, and custom keys.
		 *
		 * **Allows `string` for ObjectIds.**
		 *
		 * @template T - mongoose document.
		 * @template K - other keys to omit.
		 * @public
		 */
		export type Omit<T, K extends PlainKeys<T>> = Plain.AllowString<T, { Omit: K }>

		/**
		 * Omits Mongoose properties, all methods, and makes custom keys optional.
		 *
		 * **Allows `string` for ObjectIds.**
		 *
		 * @template T - mongoose document.
		 * @template K - other keys to make optional.
		 * @public
		 */
		export type Optional<T, K extends PlainKeys<T>> = Plain.AllowString<T, { Optional: K }>

		/**
		 * Omits Mongoose properties and all methods, and makes remaining keys optional.
		 *
		 * **Allows `string` for ObjectIds.**
		 *
		 * @template T - mongoose document.
		 * @public
		 */
		export type Partial<T> = globalThis.Partial<_AllowString<_Plain<T>>>

		/**
		 * Omits Mongoose properties and all methods, and makes remaining keys optional, recursively.
		 *
		 * **Allows `string` for ObjectIds.**
		 *
		 * @template T - mongoose document.
		 * @public
		 */
		export type PartialDeep<T> = _PartialDeep<_AllowString<_Plain<T>>>
	}
}

// tslint:enable: no-shadowed-variable

/**
 * @public
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Interface with the right keys but with `any` types, so we can enforce decorated classes to a minimal interface,
 * and we can overwrite the methods' signatures without worrying about an update of mongoose definition file breaking our types.
 * @public
 */
export type ModelAny = { [K in keyof mongoose.Model<mongoose.Document>]: any } & (new (...args: any[]) => DocumentAny)

/**
 * @public
 */
export type DocumentAny = { [K in keyof mongoose.Require_id<mongoose.Document>]: any }

/**
 * @public
 */
export type ClassType<T = any> = abstract new (...args: any) => T

/**
 * @public
 */
export type AsDocument<T> = T extends mongoose.Document ? T : T & mongoose.Document

// tslint:disable: no-empty-interface
declare global {
	/**
	 * Namespace dedicated to application-specific declaration merging.
	 * @public
	 */
	namespace RefletMongoose {
		/**
		 * Open interface to extend `@Field` SchemaType options.
		 * Useful for global plugins.
		 * @public
		 */
		interface SchemaTypeOptions {}

		/**
		 * Open class to extend every document.
		 * Useful for global plugins.
		 * @public
		 */
		interface Document extends mongoose.Document {}

		/**
		 * Open interface to extend every model with static properties and methods.
		 * Useful for gobal plugins.
		 * @public
		 */
		interface Model extends mongoose.Model<RefletMongoose.Document> {}

		/**
		 * Open interface to enforce an union of model names in `ref` SchemaType option.
		 * @public
		 */
		interface Ref {}
	}
}

declare module 'mongoose' {} // keep it for now (issue in declaration bundling)
