import mongoose from 'mongoose'
import { ConstructorType, Decorator } from './interfaces'

const MetaField = Symbol('field')
const MetaFieldDiscriminators = Symbol('field-discriminators')
const MetaFieldDiscriminatorsArray = Symbol('field-discriminators-array')

/**
 * Defines SchemaType options on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
export function Field<T extends SchemaType>(
	field: SchemaTypeOptions<T> | SchemaTypeOptions<T>[] | SchemaTypeOptions<T>[][]
): Decorator.Field

/**
 * Defines a SchemaType on a property.
 * @see https://mongoosejs.com/docs/schematypes
 * @public
 */
// tslint:disable-next-line: unified-signatures - more precise compiler errors
export function Field<T extends SchemaType>(field: T | [T] | [[T]]): Decorator.Field

export function Field<T extends SchemaType>(
	field: SchemaTypeOptions<T> | SchemaTypeOptions<T>[] | SchemaTypeOptions<T>[][] | T | [T] | [[T]]
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
	export function Nested(field: SchemaTypeNested | SchemaTypeNested[]): Decorator.FieldNested {
		return (target, key) => {
			const fields = getFields(target.constructor)
			fields[<string>key] = field
			Reflect.defineMetadata(MetaField, fields, target.constructor)
		}
	}

	/**
	 * Defines an union of discriminators on a single nested subdocument.
	 * @see https://mongoosejs.com/docs/discriminators#single-nested-discriminators
	 * @public
	 */
	export function Union(...classes: ConstructorType[]): Decorator.FieldUnion {
		return (target, key) => {
			const d11rFields = getDiscriminatorFields(target.constructor)
			d11rFields[<string>key] = classes
			Reflect.defineMetadata(MetaFieldDiscriminators, d11rFields, target.constructor)
		}
	}

	/**
	 * Defines a union of discriminators on a embedded document array.
	 * @see https://mongoosejs.com/docs/discriminators#embedded-discriminators-in-arrays
	 * @public
	 */
	export function ArrayOfUnion(...classes: ConstructorType[]): Decorator.FieldArrayOfUnion {
		return (target, key) => {
			const d11rArrayFields = getDiscriminatorArrayFields(target.constructor)
			d11rArrayFields[<string>key] = classes
			Reflect.defineMetadata(MetaFieldDiscriminatorsArray, d11rArrayFields, target.constructor)
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
export function getDiscriminatorFields(target: object): { [key: string]: ConstructorType[] } {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaFieldDiscriminators, target))
}

/**
 * @internal
 */
export function getDiscriminatorArrayFields(target: object): { [key: string]: ConstructorType[] } {
	// Clone to avoid inheritance issues: https://github.com/rbuckton/reflect-metadata/issues/62
	return Object.assign({}, Reflect.getMetadata(MetaFieldDiscriminatorsArray, target))
}

/**
 * @public
 */
type SchemaTypeNested = {
	[key: string]:
		| SchemaTypeOptions<SchemaType>
		| SchemaTypeOptions<SchemaType>[]
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
	| typeof mongoose.Schema.Types.ObjectId
	| typeof mongoose.Schema.Types.Mixed
	| mongoose.Schema

/**
 * @public
 */
interface SchemaTypeOptions<T extends SchemaType> extends Partial<RefletMongoose.SchemaTypeOptions> {
	/**
	 * [Guide reference](https://mongoosejs.com/docs/schematypes#type-key)
	 */
	type: T | [T] | [[T]]

	/**
	 * All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-required)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-required)
	 */
	required?: boolean | string | [true, string] | (() => boolean) | [() => boolean, string]

	/** All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-default) */
	default?: Infer<T> | (() => Infer<T>)

	/** All Types : [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-select) */
	select?: boolean

	/**
	 * All Types: [Guide reference](https://mongoosejs.com/docs/validation#custom-validators)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-validate)
	 */
	validate?: ValidateFn | [ValidateFn, string] | ValidateObj | ValidateObj[]

	/** All Types : [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-get) */
	get?: (value: Infer<T>) => Infer<T>

	/** All Types : [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-set) */
	set?: (value: Infer<T>) => Infer<T>

	/** All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-transform) */
	transform?: <U>(value: Infer<T>) => U

	/** All Types : [Guide](https://mongoosejs.com/docs/guide#aliases) */
	alias?: string

	/** All Types : [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-index) */
	index?: boolean

	/** All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-unique) */
	unique?: boolean

	/**
	 * All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-immutable)
	 * | [Method reference](https://mongoosejs.com/docs/api#schematype_SchemaType-immutable)
	 */
	immutable?: boolean

	/** All Types : [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-cast) */
	cast?: string

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-lowercase) */
	lowercase?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-uppercase) */
	uppercase?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-trim) */
	trim?: T extends StringConstructor ? boolean : never

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-match) */
	match?: T extends StringConstructor ? RegExp : never

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-minlength) */
	minLength?: T extends StringConstructor ? number : never

	/** String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-maxlength) */
	maxLength?: T extends StringConstructor ? number : never

	/**
	 * - Number : [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-min)
	 * - Date : [Option reference](https://mongoosejs.com/docs/api#schemadateoptions_SchemaDateOptions-min)
	 */
	min?: T extends NumberConstructor ? number : T extends DateConstructor ? Date : never
	/**
	 * - Number : [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-max)
	 * - Date : [Option reference](https://mongoosejs.com/docs/api#schemadateoptions_SchemaDateOptions-max)
	 */
	max?: T extends NumberConstructor ? number : T extends DateConstructor ? Date : never

	/**
	 * - String : [Option reference](https://mongoosejs.com/docs/api#schemastringoptions_SchemaStringOptions-enum)
	 * - Number : [Option reference](https://mongoosejs.com/docs/api#schemanumberoptions_SchemaNumberOptions-enum)
	 * - Array : [Option reference](https://mongoosejs.com/docs/api#schemaarrayoptions_SchemaArrayOptions-enum)
	 */
	enum?: T extends StringConstructor ? string[] : T extends NumberConstructor ? number[] : never

	/**
	 * ObjectId : [Guide reference](https://mongoosejs.com/docs/populate)
	 * | [Option reference](https://mongoosejs.com/docs/api#schematypeoptions_SchemaTypeOptions-ref)
	 */
	ref?: T extends typeof mongoose.Schema.Types.ObjectId
		? keyof RefletMongoose.Ref extends undefined
			? string | ConstructorType
			: keyof RefletMongoose.Ref | ConstructorType<RefletMongoose.Ref[keyof RefletMongoose.Ref]>
		: never

	/**
	 * ObjectId : [Guide reference](https://mongoosejs.com/docs/populate#dynamic-ref)
	 */
	refPath?: T extends typeof mongoose.Schema.Types.ObjectId ? string : never

	/** Map : [Guide reference](https://mongoosejs.com/docs/schematypes#maps) */
	of?: T extends MapConstructor ? SchemaType : never
}

/**
 * @public
 */
type Infer<T extends SchemaType> = T extends NumberConstructor
	? number
	: T extends StringConstructor
	? string
	: T extends BooleanConstructor
	? boolean
	: T extends DateConstructor
	? Date
	: T extends typeof mongoose.Schema.Types.ObjectId
	? mongoose.Types.ObjectId
	: Object

/**
 * @public
 */
type ValidateFn = (value: unknown) => boolean | Promise<boolean>

/**
 * @public
 */
type ValidateObj = { validator: ValidateFn; msg: string }
