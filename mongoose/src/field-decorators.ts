import * as mongoose from 'mongoose'
import { ClassType, Plain, PlainKeys, Ref, RefGlobal } from './interfaces'
import { schemaFrom } from './schema-creation'
import { RefletMongooseError } from './reflet-error'

const MetaField = Symbol('field')
const MetaFieldDiscriminators = Symbol('field-discriminators')

/**
 * Defines SchemaType options on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
export function Field<T extends Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]>(
	field: Field.Options<T> | [Field.Options<T>]
): Field.Decorator<T>

/**
 * Defines a SchemaType on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
// tslint:disable-next-line: unified-signatures - more precise compiler errors
export function Field<T extends Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]>(
	field: T
): Field.Decorator<T>

export function Field<T extends Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]>(
	field: T | Field.Options<T> | [Field.Options<T>]
): Field.Decorator<T> {
	return (target, key) => {
		const fields = getFields(target.constructor)
		fields[<string>key] = field as any
		Reflect.defineMetadata(MetaField, fields, target.constructor)
	}
}

export namespace Field {
	/**
	 * SchemaType.
	 * @see https://mongoosejs.com/docs/schematypes.html#what-is-a-schematype
	 * @public
	 */
	export type SchemaType =
		| StringConstructor
		| NumberConstructor
		| BooleanConstructor
		| DateConstructor
		| MapConstructor
		| typeof Buffer
		| typeof mongoose.SchemaType
		| mongoose.Schema
		| 'ObjectId'

	/**
	 * SchemaType Options.
	 * @see https://mongoosejs.com/docs/schematypes.html#schematype-options
	 * @public
	 */
	export type Options<T extends Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]> =
		RefletMongoose.SchemaTypeOptions &
			CommonOptions<T> &
			(T extends StringConstructor | typeof mongoose.Schema.Types.String
				? StringOptions
				: T extends StringConstructor[] | StringConstructor[][]
				? ArrayOptions<string>
				: T extends NumberConstructor | typeof mongoose.Schema.Types.Number
				? NumberOptions
				: T extends NumberConstructor[] | NumberConstructor[][]
				? ArrayOptions<number>
				: T extends DateConstructor | typeof mongoose.Schema.Types.Date
				? DateOptions
				: T extends typeof mongoose.Schema.Types.ObjectId | 'ObjectId'
				? ObjectIdOptions
				: T extends MapConstructor
				? MapOptions
				: {})

	/**
	 * Equivalent to `PropertyDecorator`.
	 * @public
	 */
	export type Decorator<T> = PropertyDecorator & {
		__mongooseField?: T
	}

	/**
	 * Defines a nested SchemaType on a property.
	 *
	 * Logic is the same as `@Field` but types are looser to allow nested objects.
	 *
	 * @see https://mongoosejs.com/docs/schematypes
	 * @public
	 */
	export function Nested<T extends Field.Nested.Options | Field.Nested.Options[]>(field: T): Field.Nested.Decorator {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = field
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace Nested {
		/**
		 * @public
		 */
		export interface Options {
			[key: string]:
				| Field.Options<Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]>
				| [Field.Options<Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]>]
				| Field.Nested.Options
				| Field.Nested.Options[]
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldNested?: never
		}
	}

	/**
	 * Defines a sub-schema on a property (uses `schemaFrom` internally).
	 * @public
	 */
	export function Schema<T extends ClassType | [ClassType]>(
		Class: T,
		options?: Field.Schema.Options<T>
	): Field.Schema.Decorator<T> {
		return (target, key) => {
			const fields = getFields(target.constructor)

			const type = Array.isArray(Class) ? [schemaFrom(Class[0])] : schemaFrom(Class)

			fields[<string>key] = { type, ...options }

			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace Schema {
		type DefaultType<T extends ClassType | [ClassType]> = T extends [ClassType]
			? Plain.Partial<InstanceType<T[number]>>[]
			: T extends ClassType
			? Plain.Partial<InstanceType<T>>
			: never

		/**
		 * @public
		 */
		export interface Options<T extends ClassType | [ClassType]> {
			/**
			 * https://mongoosejs.com/docs/validation.html#required-validators-on-nested-objects
			 */
			required?: boolean

			/**
			 * https://mongoosejs.com/docs/subdocs.html#subdocument-defaults
			 */
			default?: DefaultType<T> | ((this: any, doc: any) => DefaultType<T>)
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator<T> = PropertyDecorator & {
			__mongooseFieldSchema?: T
		}
	}

	/**
	 * Defines an union of discriminators on a single nested subdocument.
	 * @see https://mongoosejs.com/docs/discriminators#single-nested-discriminators
	 * @public
	 */
	export function Union<T extends ClassType>(
		classes: T[],
		options?: Field.Union.Options<InstanceType<T>>
	): Field.Union.Decorator
	export function Union(...classes: ClassType[]): Field.Union.Decorator
	export function Union(
		...args: ClassType[] | (ClassType[] | Field.Union.Options<any> | undefined)[]
	): Field.Union.Decorator {
		return (target, key) => {
			const fields = getFields(target.constructor)
			// We must remove _id from the base schema or `{ _id: false }` won't do anything on the discriminator schema (_id is still there by default).
			fields[<string>key] = new mongoose.Schema({}, { _id: false })
			Reflect.defineMetadata(MetaField, fields, target.constructor)
			const discriminatorFields = getDiscriminatorFields(target.constructor)

			discriminatorFields[<string>key] = Array.isArray(args[0])
				? { classes: args[0] as ClassType[], options: args[1] as Field.Union.Options<any> | undefined }
				: { classes: args as ClassType[] }

			Reflect.defineMetadata(MetaFieldDiscriminators, discriminatorFields, target.constructor)
		}
	}

	export namespace Union {
		/**
		 * @public
		 */
		export interface Options<T> {
			/** If `true`, the field itself is required. */
			required?: boolean

			/** If `true`, the discriminator key in nested schemas is always required and narrowed to its possible values. */
			strict?: boolean

			// Distributive https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
			default?: T extends any ? Plain.Partial<T> : never
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldUnion?: never
		}
	}

	/**
	 * Defines a union of discriminators on a embedded document array.
	 * @see https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
	 * @public
	 */
	export function ArrayOfUnion<T extends ClassType>(
		classes: T[],
		options?: Field.ArrayOfUnion.Options<InstanceType<T>>
	): Field.ArrayOfUnion.Decorator
	export function ArrayOfUnion(...classes: ClassType[]): Field.ArrayOfUnion.Decorator
	export function ArrayOfUnion(
		...args: ClassType[] | (ClassType[] | Field.ArrayOfUnion.Options<any> | undefined)[]
	): Field.ArrayOfUnion.Decorator {
		return (target, key) => {
			const fields = getFields(target.constructor)
			// We must remove _id from the base schema or `{ _id: false }` won't do anything on the discriminator schema (_id is still there by default).
			fields[<string>key] = [new mongoose.Schema({}, { _id: false })]
			Reflect.defineMetadata(MetaField, fields, target.constructor)

			const discriminatorArrayFields = getDiscriminatorFields(target.constructor)

			discriminatorArrayFields[<string>key] = Array.isArray(args[0])
				? { classes: args[0] as ClassType[], options: args[1] as Field.ArrayOfUnion.Options<any> | undefined }
				: { classes: args as ClassType[] }

			Reflect.defineMetadata(MetaFieldDiscriminators, discriminatorArrayFields, target.constructor)
		}
	}

	export namespace ArrayOfUnion {
		/**
		 * @public
		 */
		export interface Options<T> {
			/** If `true`, the field itself is required. */
			required?: boolean

			/** If `true`, the discriminator key in nested schemas is always required and narrowed to its possible values. */
			strict?: boolean

			// Distributive https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
			default?: Array<T extends any ? Plain.Partial<T> : never>
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldArrayOfUnion?: never
		}
	}

	/**
	 * Define references more succintly.
	 * @see https://mongoosejs.com/docs/populate.html#populate
	 *
	 * @example
	 * ```ts
	 * ＠Model()
	 * class Company extends Model.I {
	 *   ＠Field(String)
	 *   name: Company
	 * }
	 *
	 * ＠Model()
	 * class User extends Model.I {
	 *   ＠Field.Ref(Company, { required: true })
	 *   company: Company | ObjectId
	 * }
	 * ```
	 * ---
	 * @public
	 */
	export function Ref<T extends Record<string, any>>(
		ref: Ref<any, T> | [Ref<any, T>],
		options: Field.Ref.Options = {}
	): Field.Ref.Decorator<T> {
		return (target, key) => {
			const type = mongoose.Schema.Types.ObjectId

			const fields = getFields(target.constructor)

			fields[<string>key] = Array.isArray(ref)
				? [{ type, ref: ref[0], ...(options as {}) }]
				: { type, ref, ...(options as {}) }

			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace Ref {
		/**
		 * @public
		 */
		export interface Options
			extends RefletMongoose.SchemaTypeOptions,
				Pick<CommonOptions<'ObjectId'>, 'required' | 'index' | 'unique' | 'select' | 'default'> {}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator<T> = PropertyDecorator & {
			__mongooseFieldRef?: T
		}
	}

	/**
	 * Define dynamic references more succintly.
	 * @see https://mongoosejs.com/docs/populate.html#dynamic-ref
	 * @public
	 */
	export function RefPath<T extends Record<string, any>>(
		refPath: PlainKeys<T> | [PlainKeys<T>],
		options: Field.Ref.Options = {}
	): Field.RefPath.Decorator {
		return (target, key) => {
			const type = mongoose.Schema.Types.ObjectId

			const fields = getFields(target.constructor)

			fields[<string>key] = Array.isArray(refPath)
				? [{ type, refPath: refPath[0], ...(options as {}) }]
				: { type, refPath, ...(options as {}) }

			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace RefPath {
		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldRefPath?: never
		}
	}

	/**
	 * @public
	 */
	export function Enum<T extends string | number, D extends T>(
		values: T[] extends string[] ? T[] : T[] extends number[] ? T[] : never,
		options?: Field.Enum.Options<D>
	): Field.Enum.Decorator {
		return (target, key) => {
			if (!Array.isArray(values)) {
				throw new RefletMongooseError(
					'INVALID_FIELD_TYPE',
					`Parameter of @Field.Enum "${target.constructor.name}.${key.toString()}" should be an array`
				)
			}

			const type = typeof values[0] === 'string' ? String : typeof values[0] === 'number' ? Number : null

			if (!type) {
				throw new RefletMongooseError(
					'INVALID_FIELD_TYPE',
					`Values of @Field.Enum "${
						target.constructor.name
					}.${key.toString()}" should either be strings or numbers`
				)
			}

			const fields = getFields(target.constructor)

			fields[<string>key] = { type, enum: values, ...options }

			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace Enum {
		/**
		 * @public
		 */
		export type Options<T extends string | number> = {
			required?: boolean
			default?: T | ((this: any, doc: any) => T)
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldEnum?: never
		}
	}

	/**
	 * @public
	 */
	export function ArrayOfEnum<T extends string | number, D extends T>(
		values: T[] extends string[] ? T[] : T[] extends number[] ? T[] : never,
		options: Field.ArrayOfEnum.Options<D>
	): Field.ArrayOfEnum.Decorator {
		return (target, key) => {
			if (!Array.isArray(values)) {
				throw new RefletMongooseError(
					'INVALID_FIELD_TYPE',
					`Parameter of @Field.ArrayOfEnum "${target.constructor.name}.${key.toString()}" should be an array`
				)
			}

			const type = typeof values[0] === 'string' ? [String] : typeof values[0] === 'number' ? [Number] : null

			if (!type) {
				throw new RefletMongooseError(
					'INVALID_FIELD_TYPE',
					`Values of @Field.ArrayOfEnum "${
						target.constructor.name
					}.${key.toString()}" should either be strings or numbers`
				)
			}

			const fields = getFields(target.constructor)

			fields[<string>key] = { type, enum: values, ...options }

			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	export namespace ArrayOfEnum {
		/**
		 * @public
		 */
		export type Options<T extends string | number> = {
			required?: boolean
			default?: T[] | ((this: any, doc: any) => T[])
		}

		/**
		 * Equivalent to `PropertyDecorator`.
		 * @public
		 */
		export type Decorator = PropertyDecorator & {
			__mongooseFieldArrayOfEnum?: never
		}
	}
}

/**
 * @internal
 */
export function getFields(target: object): mongoose.SchemaDefinition<any> {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaField, target))
}

/**
 * @internal
 */
export function getDiscriminatorFields(target: object): {
	[key: string]: { classes: ClassType[]; options?: Field.Union.Options<any> }
} {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaFieldDiscriminators, target))
}

/**
 * @public
 */
interface CommonOptions<T extends Field.SchemaType | [Field.SchemaType] | [[Field.SchemaType]]> {
	/**
	 * The type to cast this path to.
	 *
	 * [Guide reference](https://mongoosejs.com/docs/schematypes#type-key)
	 */
	type: T

	/**
	 * If `true`, attach a required validator to this path, which ensures this path path cannot be set to a nullish value.
	 * If a function, Mongoose calls the function and only checks for nullish values if the function returns a truthy value.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-required)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-required)
	 */
	required?: boolean | string | [true, string] | (() => boolean) | [() => boolean, string]

	/**
	 * The default value for this path.
	 * If a function, Mongoose executes the function and uses the return value as the default.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-default)
	 */
	default?: Infer<T> | ((this: any, doc: any) => Infer<T>)

	/**
	 * Whether to include or exclude this path by default when loading documents using find(), findOne(), etc.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-select)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-select)
	 */
	select?: boolean

	/**
	 * Function or object describing how to validate this schematype.
	 *
	 * _All types_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/validation#custom-validators)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-validate)
	 */
	validate?:
		| ((value: Infer<T>) => boolean | Promise<boolean>)
		| [(value: Infer<T>) => boolean | Promise<boolean>, string]
		| ValidateObj<Infer<T>>
		| ValidateObj<Infer<T>>[]
		| RegExp
		| [RegExp, string]

	/**
	 * _All types_
	 *
	 * [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-get)
	 */
	get?: (value: Infer<T>) => Infer<T>

	/**
	 * _All types_
	 *
	 * [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-set)
	 */
	set?: (value: Infer<T>) => Infer<T>

	/**
	 * Define a transform function for this individual schema type. Only called when calling `toJSON()` or `toObject()`.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-transform)
	 */
	transform?: <U>(value: Infer<T>) => U

	/**
	 * Defines a virtual with the given name that gets/sets this path.
	 *
	 * _All types_
	 *
	 * [Guide](https://mongoosejs.com/docs/guide#aliases)
	 */
	alias?: string

	/**
	 * Build an index on this path when the model is compiled.
	 *
	 * _All types_
	 *
	 * [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-index)
	 */
	index?: boolean | string | mongoose.IndexOptions

	/**
	 * Build a unique index on this path when the model is compiled. The unique option is not a validator.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-unique)
	 */
	unique?: boolean

	/**
	 * If truthy, Mongoose will build a text index on this path.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api.html#schematypeoptions_SchemaTypeOptions-text)
	 */
	text?: boolean | number

	/**
	 * Disallow changes to this path once the document is saved to the database for the first time.
	 *
	 * _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-immutable)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-immutable)
	 */
	immutable?: boolean | ((this: any, doc: any) => boolean)

	/**
	 * Allows overriding casting logic for this individual path.
	 * If a `string`, the given string overwrites Mongoose's default cast error message.
	 *
	 *  _All types_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-cast)
	 */
	cast?: ((val: any) => Infer<T>) | string
}

/**
 * @public
 */
interface StringOptions {
	/**
	 * Add a custom setter that lowercases this string using JavaScript's built-in `String#toLowerCase()`.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-lowercase)
	 */
	lowercase?: boolean

	/**
	 * Add a custom setter that uppercases this string using JavaScript's built-in `String#toUpperCase()`.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-uppercase)
	 */
	uppercase?: boolean

	/**
	 * Add a custom setter that removes leading and trailing whitespace using JavaScript's built-in `String#trim()`.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-trim)
	 */
	trim?: boolean

	/**
	 * Attaches a validator that succeeds if the data string matches the given regular expression, and fails otherwise.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-match)
	 */
	match?: RegExp

	/**
	 * Add a custom validator that ensures the given string's `length` is at least the given number.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-minlength)
	 */
	minLength?: number

	/**
	 * Add a custom validator that ensures the given string's `length` is at most the given number.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-maxlength)
	 */
	maxLength?: number

	/**
	 * Array of allowed values for this path.
	 *
	 * _String type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-enum)
	 */
	enum?: string[]
}

/**
 * @public
 */
interface NumberOptions {
	/**
	 * The minimum value allowed.
	 *
	 * _Number type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-min)
	 */
	min?: number

	/**
	 * The maximum value allowed.
	 *
	 * _Number type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-max)
	 */
	max?: number

	/**
	 * Array of allowed values.
	 *
	 * _Number type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-enum)
	 */
	enum?: number[]
}

/**
 * @public
 */
interface ArrayOptions<T extends string | number> {
	/**
	 * _Array type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemaarrayoptions_SchemaArrayOptions-enum)
	 */
	enum?: T[]
}

/**
 * @public
 */
interface DateOptions {
	/**
	 * The minimum date allowed.
	 *
	 * _Date type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemadateoptions_SchemaDateOptions-min)
	 */
	min?: Date

	/**
	 * The maximum date allowed.
	 *
	 * _Date type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api#schemadateoptions_SchemaDateOptions-max)
	 */
	max?: Date

	/**
	 * Defines a TTL index on this path.
	 *
	 * _Date type_
	 *
	 * [Option reference](https://mongoosejs.com/docs/api.html#schemadateoptions_SchemaDateOptions-expires)
	 */
	expires?: number | Date
}

/**
 * @public
 */
interface ObjectIdOptions {
	/**
	 * The model that `populate()` should use if populating this path.
	 *
	 * _ObjectId type_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/populate)
	 * | [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-ref)
	 */
	ref?: RefGlobal

	/**
	 * _ObjectId type_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/populate#dynamic-ref)
	 */
	refPath?: string
}

/**
 * @public
 */
interface MapOptions {
	/**
	 *  _Map type_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/schematypes#maps)
	 */
	of?: Field.SchemaType
}

/**
 * @public
 */
type Infer<T> = T extends NumberConstructor | typeof mongoose.Schema.Types.Number
	? number
	: T extends StringConstructor | typeof mongoose.Schema.Types.String
	? string
	: T extends BooleanConstructor | typeof mongoose.Schema.Types.Boolean
	? boolean
	: T extends DateConstructor | typeof mongoose.Schema.Types.Date
	? Date
	: T extends typeof mongoose.Schema.Types.ObjectId | 'ObjectId'
	? mongoose.Types.ObjectId
	: T extends [infer U]
	? Infer<U>[]
	: T extends [[infer V]]
	? Infer<V>[][]
	: Object

/**
 * @public
 */
interface ValidateObj<T> {
	validator: (value: T) => boolean | Promise<boolean>
	msg?: string | ValidateMessageFn<T>
	message?: string | ValidateMessageFn<T>
}

/**
 * @public
 */
type ValidateMessageFn<T> = (props: {
	validator: (value: T) => boolean | Promise<boolean>
	message: ValidateMessageFn<T>
	type: string
	path: string
	value: T
}) => string
