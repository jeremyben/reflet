import * as mongoose from 'mongoose'
import { ConstructorType, Decorator } from './interfaces'
import { schemaFrom } from './schema-creation'

const MetaField = Symbol('field')
const MetaFieldDiscriminators = Symbol('field-discriminators')

/**
 * Defines SchemaType options on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
export function Field<T extends SchemaType | [SchemaType] | [[SchemaType]]>(
	field: SchemaTypeOptions<T> | [SchemaTypeOptions<T>]
): Decorator.Field

/**
 * Defines a SchemaType on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
// tslint:disable-next-line: unified-signatures - more precise compiler errors
export function Field<T extends SchemaType | [SchemaType] | [[SchemaType]]>(field: T): Decorator.Field

export function Field<T extends SchemaType | [SchemaType] | [[SchemaType]]>(
	field: T | SchemaTypeOptions<T> | [SchemaTypeOptions<T>]
): Decorator.Field {
	return (target, key) => {
		const fields = getFields(target.constructor)
		fields[<string>key] = field
		Reflect.defineMetadata(MetaField, fields, target.constructor)
	}
}

export namespace Field {
	/**
	 * Defines a nested SchemaType on a property.
	 *
	 * Logic is the same as `@Field` but types are looser to allow nested objects.
	 *
	 * @see https://mongoosejs.com/docs/schematypes
	 * @public
	 */
	export function Nested<T extends SchemaTypeNested | SchemaTypeNested[]>(field: T): Decorator.FieldNested {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = field
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	/**
	 * Defines a sub-schema on a property (uses `schemaFrom` internally).
	 * @public
	 */
	export function Schema<T extends ConstructorType | [ConstructorType]>(Class: T): Decorator.FieldSchema {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = Array.isArray(Class) ? [schemaFrom(Class[0])] : schemaFrom(Class as ConstructorType)
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	/**
	 * Defines an union of discriminators on a single nested subdocument.
	 * @see https://mongoosejs.com/docs/discriminators#single-nested-discriminators
	 * @public
	 */
	export function Union(classes: ConstructorType[], options?: UnionOptions): Decorator.FieldUnion
	export function Union(...classes: ConstructorType[]): Decorator.FieldUnion
	export function Union(
		...args: ConstructorType[] | (ConstructorType[] | UnionOptions | undefined)[]
	): Decorator.FieldUnion {
		return (target, key) => {
			const fields = getFields(target.constructor)
			// We must remove _id from the base schema or `{ _id: false }` won't do anything on the discriminator schema (_id is still there by default).
			fields[<string>key] = new mongoose.Schema({}, { _id: false })
			Reflect.defineMetadata(MetaField, fields, target.constructor)
			const discriminatorFields = getDiscriminatorFields(target.constructor)

			discriminatorFields[<string>key] = Array.isArray(args[0])
				? { classes: args[0] as ConstructorType[], options: args[1] as UnionOptions | undefined }
				: { classes: args as ConstructorType[] }

			Reflect.defineMetadata(MetaFieldDiscriminators, discriminatorFields, target.constructor)
		}
	}

	/**
	 * Defines a union of discriminators on a embedded document array.
	 * @see https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
	 * @public
	 */
	export function ArrayOfUnion(classes: ConstructorType[], options?: UnionOptions): Decorator.FieldArrayOfUnion
	export function ArrayOfUnion(...classes: ConstructorType[]): Decorator.FieldArrayOfUnion
	export function ArrayOfUnion(
		...args: ConstructorType[] | (ConstructorType[] | UnionOptions | undefined)[]
	): Decorator.FieldArrayOfUnion {
		return (target, key) => {
			const fields = getFields(target.constructor)
			// We must remove _id from the base schema or `{ _id: false }` won't do anything on the discriminator schema (_id is still there by default).
			fields[<string>key] = [new mongoose.Schema({}, { _id: false })]
			Reflect.defineMetadata(MetaField, fields, target.constructor)

			const discriminatorArrayFields = getDiscriminatorFields(target.constructor)

			discriminatorArrayFields[<string>key] = Array.isArray(args[0])
				? { classes: args[0] as ConstructorType[], options: args[1] as UnionOptions | undefined }
				: { classes: args as ConstructorType[] }

			Reflect.defineMetadata(MetaFieldDiscriminators, discriminatorArrayFields, target.constructor)
		}
	}
}

/**
 * @internal
 */
export function getFields(target: object): { [key: string]: any } {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaField, target))
}

/**
 * @internal
 */
export function getDiscriminatorFields(
	target: object
): { [key: string]: { classes: ConstructorType[]; options?: UnionOptions } } {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaFieldDiscriminators, target))
}

/**
 * @public
 */
type SchemaTypeNested = {
	[key: string]:
		| SchemaTypeOptions<SchemaType | [SchemaType] | [[SchemaType]]>
		| [SchemaTypeOptions<SchemaType | [SchemaType] | [[SchemaType]]>]
		| SchemaTypeNested
		| SchemaTypeNested[]
}

/**
 * @public
 */
type SchemaType =
	| StringConstructor
	| NumberConstructor
	| BooleanConstructor
	| DateConstructor
	| MapConstructor
	| typeof Buffer
	| typeof mongoose.SchemaType
	| mongoose.Schema

/**
 * @public
 */
type SchemaTypeOptions<T extends SchemaType | [SchemaType] | [[SchemaType]]> = RefletMongoose.SchemaTypeOptions & {
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
	cast?: string
} & (T extends StringConstructor | typeof mongoose.Schema.Types.String
		? StringOptions
		: T extends StringConstructor[] | StringConstructor[][]
		? ArrayOptions<string>
		: T extends NumberConstructor | typeof mongoose.Schema.Types.Number
		? NumberOptions
		: T extends NumberConstructor[] | NumberConstructor[][]
		? ArrayOptions<number>
		: T extends DateConstructor | typeof mongoose.Schema.Types.Date
		? DateOptions
		: T extends typeof mongoose.Schema.Types.ObjectId
		? ObjectIdOptions
		: T extends MapConstructor
		? MapOptions
		: {})

/**
 * @public
 */
type StringOptions = {
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
type NumberOptions = {
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
type ArrayOptions<T extends string | number> = {
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
type DateOptions = {
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
type ObjectIdOptions = {
	/**
	 * The model that `populate()` should use if populating this path.
	 *
	 * _ObjectId type_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/populate)
	 * | [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-ref)
	 */
	ref?: keyof RefletMongoose.Ref extends undefined
		? string | mongoose.Model<any> | ((this: any, doc: any) => string | mongoose.Model<any>)
		:
				| keyof RefletMongoose.Ref
				| ConstructorType<RefletMongoose.Ref[keyof RefletMongoose.Ref]>
				| ((
						this: any,
						doc: any
				  ) => keyof RefletMongoose.Ref | ConstructorType<RefletMongoose.Ref[keyof RefletMongoose.Ref]>)

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
type MapOptions = {
	/**
	 *  _Map type_
	 *
	 * [Guide reference](https://mongoosejs.com/docs/schematypes#maps)
	 */
	of?: SchemaType
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
	: T extends typeof mongoose.Schema.Types.ObjectId
	? mongoose.Types.ObjectId
	: T extends [infer U]
	? Infer<U>[]
	: T extends [[infer V]]
	? Infer<V>[][]
	: Object

/**
 * @public
 */
type ValidateObj<T> = {
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

/**
 * @public
 */
type UnionOptions = {
	/** If `true`, the field itself is required. */
	required?: boolean

	/** If `true`, the discriminator key in nested schemas is always required and narrowed to its possible values. */
	strict?: boolean
}
